"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Button } from "@/components/Button";

const STORAGE_KEY = "allantech-fingerprint-record";

type FingerprintRecord = {
  applicantName: string;
  purpose: string;
  documentRef: string;
  issuedBy: string;
  capturedAt: string;
  originalImage: string;
  enhancedImage: string;
  inkImage: string;
};

type Props = {
  mode?: "capture" | "letter";
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function enhanceFingerprint(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement) {
  const context = sourceCanvas.getContext("2d");
  const targetContext = targetCanvas.getContext("2d");

  if (!context || !targetContext) {
    throw new Error("Canvas processing is unavailable on this device.");
  }

  const { width, height } = sourceCanvas;
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;
    const normalized = grayscale / 255;
    const enhanced = normalized > 0.55 ? 255 : Math.max(0, grayscale * 0.42);

    data[index] = enhanced;
    data[index + 1] = enhanced;
    data[index + 2] = enhanced;
  }

  targetCanvas.width = width;
  targetCanvas.height = height;
  targetContext.putImageData(source, 0, 0);
}

function createInkFingerprint(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement) {
  const context = sourceCanvas.getContext("2d");
  const targetContext = targetCanvas.getContext("2d");

  if (!context || !targetContext) {
    throw new Error("Canvas processing is unavailable on this device.");
  }

  const { width, height } = sourceCanvas;
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const grayscale = 0.299 * red + 0.587 * green + 0.114 * blue;
    const ridgeStrength = 1 - grayscale / 255;
    const alpha = ridgeStrength > 0.28 ? Math.min(255, ridgeStrength * 320) : 0;

    data[index] = 26;
    data[index + 1] = 77;
    data[index + 2] = 158;
    data[index + 3] = alpha;
  }

  targetCanvas.width = width;
  targetCanvas.height = height;
  targetContext.clearRect(0, 0, width, height);
  targetContext.fillStyle = "#ffffff";
  targetContext.fillRect(0, 0, width, height);
  targetContext.putImageData(source, 0, 0);
}

export function FingerprintStudio({ mode = "capture" }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [purpose, setPurpose] = useState("Thumb verification request");
  const [documentRef, setDocumentRef] = useState("");
  const [issuedBy, setIssuedBy] = useState("ALLANTECH Biometric Desk");
  const [capturedAt, setCapturedAt] = useState(getTodayValue());
  const [originalImage, setOriginalImage] = useState("");
  const [enhancedImage, setEnhancedImage] = useState("");
  const [inkImage, setInkImage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved) as FingerprintRecord;
      setApplicantName(parsed.applicantName);
      setPurpose(parsed.purpose);
      setDocumentRef(parsed.documentRef);
      setIssuedBy(parsed.issuedBy);
      setCapturedAt(parsed.capturedAt);
      setOriginalImage(parsed.originalImage);
      setEnhancedImage(parsed.enhancedImage);
      setInkImage(parsed.inkImage ?? "");
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);


  useEffect(() => {
    if (mode !== "capture") {
      return;
    }

    return () => {
      stopCamera();
    };
  }, [mode]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  function getCameraErrorMessage(caughtError: unknown) {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      return `Camera access is blocked because this page is running on an insecure origin (${window.location.origin}). Open the app on HTTPS or use localhost.`;
    }

    if (!(caughtError instanceof DOMException)) {
      return caughtError instanceof Error
        ? caughtError.message
        : "Unable to access the phone camera.";
    }

    if (caughtError.name === "NotAllowedError") {
      return "Camera permission was denied. Allow camera access in your browser settings and reload the page.";
    }

    if (caughtError.name === "NotFoundError") {
      return "No camera was found on this device.";
    }

    if (caughtError.name === "NotReadableError") {
      return "The camera is already in use by another app. Close other camera apps and try again.";
    }

    if (caughtError.name === "OverconstrainedError") {
      return "The preferred back camera is unavailable on this device. Try again and the app will fall back to any available camera.";
    }

    if (caughtError.name === "SecurityError") {
      return "Browser security blocked camera access. Use HTTPS or localhost and try again.";
    }

    return caughtError.message;
  }

  async function startCamera() {
    setBusy(true);
    setError("");
    setStatus("Requesting camera permission...");

    try {
      stopCamera();

      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new DOMException("Camera requires a secure context.", "SecurityError");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "This browser does not expose camera APIs here. Use a modern mobile browser over HTTPS.",
        );
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (primaryError) {
        if (
          primaryError instanceof DOMException &&
          ["OverconstrainedError", "NotFoundError"].includes(primaryError.name)
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw primaryError;
        }
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Video preview is not available.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
      setStatus("Camera is ready. Place the thumb inside the frame and capture.");
    } catch (caughtError) {
      setError(getCameraErrorMessage(caughtError));
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function saveRecord(record: FingerprintRecord) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }

  function captureFingerprint() {
    const video = videoRef.current;
    const captureCanvas = captureCanvasRef.current;
    const enhancedCanvas = enhancedCanvasRef.current;
    const inkCanvas = document.createElement("canvas");

    if (!video || !captureCanvas || !enhancedCanvas) {
      setError("Camera canvas is not ready yet.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError("Wait for the camera preview to finish loading.");
      return;
    }

    setError("");

    const cropWidth = Math.floor(video.videoWidth * 0.5);
    const cropHeight = Math.floor(video.videoHeight * 0.72);
    const startX = Math.floor((video.videoWidth - cropWidth) / 2);
    const startY = Math.floor((video.videoHeight - cropHeight) / 2);

    captureCanvas.width = cropWidth;
    captureCanvas.height = cropHeight;

    const context = captureCanvas.getContext("2d");

    if (!context) {
      setError("Unable to capture image on this device.");
      return;
    }

    context.drawImage(
      video,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    enhanceFingerprint(captureCanvas, enhancedCanvas);
    createInkFingerprint(captureCanvas, inkCanvas);

    const original = captureCanvas.toDataURL("image/png");
    const enhanced = enhancedCanvas.toDataURL("image/png");
    const ink = inkCanvas.toDataURL("image/png");
    const record = {
      applicantName,
      purpose,
      documentRef,
      issuedBy,
      capturedAt,
      originalImage: original,
      enhancedImage: enhanced,
      inkImage: ink,
    };

    setOriginalImage(original);
    setEnhancedImage(enhanced);
    setInkImage(ink);
    saveRecord(record);
    setStatus("Thumb image captured. Blue-ink print version is ready for the letter.");
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const captureCanvas = captureCanvasRef.current;
        const enhancedCanvas = enhancedCanvasRef.current;
        const inkCanvas = document.createElement("canvas");

        if (!captureCanvas || !enhancedCanvas) {
          setError("Canvas is not available.");
          return;
        }

        captureCanvas.width = image.width;
        captureCanvas.height = image.height;

        const context = captureCanvas.getContext("2d");

        if (!context) {
          setError("Unable to process the uploaded image.");
          return;
        }

        context.drawImage(image, 0, 0);
        enhanceFingerprint(captureCanvas, enhancedCanvas);
        createInkFingerprint(captureCanvas, inkCanvas);

        const original = captureCanvas.toDataURL("image/png");
        const enhanced = enhancedCanvas.toDataURL("image/png");
        const ink = inkCanvas.toDataURL("image/png");
        const record = {
          applicantName,
          purpose,
          documentRef,
          issuedBy,
          capturedAt,
          originalImage: original,
          enhancedImage: enhanced,
          inkImage: ink,
        };

        setOriginalImage(original);
        setEnhancedImage(enhanced);
        setInkImage(ink);
        saveRecord(record);
        setStatus("Image imported and converted into a blue-ink print preview.");
        setError("");
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!enhancedImage && !originalImage) {
      return;
    }

    saveRecord({
      applicantName,
      purpose,
      documentRef,
      issuedBy,
      capturedAt,
      originalImage,
      enhancedImage,
      inkImage,
    });
  }, [applicantName, purpose, documentRef, issuedBy, capturedAt, originalImage, enhancedImage, inkImage]);

  if (mode === "letter") {
    return (
      <div className="grid">
        <section className="card letter-shell">
          <div className="card__header letter-actions">
            <Button onClick={() => window.print()} type="button">
              Print Official Letter
            </Button>
            <Link className="button button--secondary" href="/register">
              Return to Capture
            </Link>
          </div>

          <article className="letter" id="print-letter">
            <header className="letter__header">
              <div>
                <p className="letter__brand">ALLANTECH ORGANIZATION</p>
                <h2>Official Thumb Impression Record</h2>
              </div>
              <div className="letter__meta">
                <span>Date: {capturedAt || getTodayValue()}</span>
                <span>Reference: {documentRef || "—"}</span>
              </div>
            </header>

            <div className="letter__body">
              <p className="letter__salutation">To whom it may concern,</p>
              <p className="letter__statement">
                This document certifies that <strong>{applicantName || "—"}</strong> has 
                provided their thumb impression for <strong>{purpose || "official verification"}</strong>.
              </p>
              <p className="letter__method">
                The impression was captured using secure digital methods and is presented 
                below as an authentic ink representation suitable for official records.
              </p>

              <div className="letter__impression-section">
                <div className="impression-box">
                  <div className="impression-label">Official Thumb Impression</div>
                  {inkImage ? (
                    <div className="fingerprint-impression">
                      <NextImage
                        alt="Official thumb impression"
                        height={640}
                        src={inkImage}
                        unoptimized
                        width={480}
                      />
                    </div>
                  ) : (
                    <div className="impression-placeholder">
                      <span>Impression pending capture</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="letter__footer">
                <div className="letter__details">
                  <div className="detail-row">
                    <span className="detail-label">Applicant:</span>
                    <span className="detail-value">{applicantName || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reference Number:</span>
                    <span className="detail-value">{documentRef || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Capture:</span>
                    <span className="detail-value">{capturedAt || getTodayValue()}</span>
                  </div>
                </div>

                <div className="letter__authorization">
                  <div className="auth-row">
                    <span className="auth-label">Authorized by:</span>
                    <span className="auth-value">{issuedBy || "ALLANTECH Biometric Desk"}</span>
                  </div>
                  <div className="signature-line">
                    <span className="signature-label">Signature:</span>
                    <div className="signature-space"></div>
                  </div>
                  <div className="stamp-area">
                    <div className="official-stamp">
                      <span>OFFICIAL</span>
                      <small>ALLANTECH</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="grid capture-layout">
      <section className="hero hero--compact">
        <p className="eyebrow">ALLANTECH Organization</p>
        <h1>Thumb Impression Capture</h1>
        <p>
          Position your thumb within the camera guide and capture a clear impression 
          for your official record. The system will prepare a professional document 
          ready for printing.
        </p>
        <div className="hero__actions">
          <Button busy={busy} onClick={startCamera} type="button">
            Start Camera
          </Button>
          <Link className="button button--secondary" href="/dashboard">
            View Document
          </Link>
        </div>
      </section>

      <section className="card studio">
        <div className="card__header">
          <p className="eyebrow">Capture Details</p>
          <h2>Record Information</h2>
          <p>
            Complete the information below before capturing the thumb impression. 
            All fields marked are required for your official document.
          </p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="applicantName">Applicant Name</label>
            <input
              id="applicantName"
              required
              value={applicantName}
              onChange={(event) => setApplicantName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="documentRef">Document Reference</label>
            <input
              id="documentRef"
              value={documentRef}
              onChange={(event) => setDocumentRef(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purpose">Purpose</label>
            <input
              id="purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="issuedBy">Issued By</label>
            <input
              id="issuedBy"
              value={issuedBy}
              onChange={(event) => setIssuedBy(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="capturedAt">Capture Date</label>
            <input
              id="capturedAt"
              type="date"
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="importImage">Import Existing Image</label>
            <input
              id="importImage"
              accept="image/*"
              onChange={handleFileImport}
              type="file"
            />
          </div>
        </div>

        <div className="studio__preview">
          <div className="intake-strip">
            <div>
              <span>Step 1</span>
              <strong>Enable camera</strong>
            </div>
            <div>
              <span>Step 2</span>
              <strong>Position thumb in frame</strong>
            </div>
            <div>
              <span>Step 3</span>
              <strong>Generate document</strong>
            </div>
          </div>

          <div className="camera-frame">
            <video muted playsInline ref={videoRef} />
            <div className="camera-guide" />
            {!cameraReady ? (
              <div className="camera-frame__empty">
                Camera preview will appear here once camera access is enabled.
              </div>
            ) : null}
          </div>

          <div className="stack-inline">
            <Button disabled={!cameraReady} onClick={captureFingerprint} type="button">
              Capture Impression
            </Button>
            <Button onClick={stopCamera} type="button" variant="secondary">
              Stop Camera
            </Button>
          </div>

          <p className={`status ${error ? "status--error" : "status--success"}`}>
            {error || status}
          </p>
          {error && error.includes("secure") ? (
            <div className="help-card">
              <p>
                For security, camera access requires a secure connection. Please ensure 
                you are accessing this page via HTTPS or contact your administrator 
                for assistance.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card results">
        <div className="card__header">
          <p className="eyebrow">Preview</p>
          <h2>Captured Impression</h2>
          <p>
            Review your captured impression below. Once satisfied, proceed to generate 
            your official document for printing.
          </p>
        </div>

        <div className="results__grid results__grid--triple">
          <figure className="result-card">
            <span>Original Capture</span>
            {originalImage ? (
              <NextImage
                alt="Original thumb photograph"
                height={640}
                src={originalImage}
                unoptimized
                width={480}
              />
            ) : (
              <div className="result-placeholder">Capture an impression to see preview</div>
            )}
          </figure>
          <figure className="result-card result-card--ink">
            <span>Official Impression</span>
            {inkImage ? (
              <NextImage
                alt="Official ink impression"
                height={640}
                src={inkImage}
                unoptimized
                width={480}
              />
            ) : (
              <div className="result-placeholder">Official impression will appear here</div>
            )}
          </figure>
          <figure className="result-card">
            <span>Enhanced Detail</span>
            {enhancedImage ? (
              <NextImage
                alt="Enhanced detail view"
                height={640}
                src={enhancedImage}
                unoptimized
                width={480}
              />
            ) : (
              <div className="result-placeholder">Enhanced detail will appear here</div>
            )}
          </figure>
        </div>

        <div className="stack-inline">
          <Link className="button button--primary" href="/dashboard">
            Generate Official Document
          </Link>
        </div>
      </section>

      <canvas className="hidden-canvas" ref={captureCanvasRef} />
      <canvas className="hidden-canvas" ref={enhancedCanvasRef} />
    </div>
  );
}
