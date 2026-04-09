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

  async function startCamera() {
    setBusy(true);
    setError("");
    setStatus("Requesting camera permission...");

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error("Video preview is not available.");
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
      setStatus("Camera is ready. Place the thumb inside the frame and capture.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to access the phone camera.",
      );
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

    const original = captureCanvas.toDataURL("image/png");
    const enhanced = enhancedCanvas.toDataURL("image/png");
    const record = {
      applicantName,
      purpose,
      documentRef,
      issuedBy,
      capturedAt,
      originalImage: original,
      enhancedImage: enhanced,
    };

    setOriginalImage(original);
    setEnhancedImage(enhanced);
    saveRecord(record);
    setStatus("Thumb image captured and scan preview generated.");
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

        const original = captureCanvas.toDataURL("image/png");
        const enhanced = enhancedCanvas.toDataURL("image/png");
        const record = {
          applicantName,
          purpose,
          documentRef,
          issuedBy,
          capturedAt,
          originalImage: original,
          enhancedImage: enhanced,
        };

        setOriginalImage(original);
        setEnhancedImage(enhanced);
        saveRecord(record);
        setStatus("Image imported and enhanced for print preview.");
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
    });
  }, [applicantName, purpose, documentRef, issuedBy, capturedAt, originalImage, enhancedImage]);

  if (mode === "letter") {
    return (
      <div className="grid">
        <section className="card letter-shell">
          <div className="card__header">
            <p className="eyebrow">ALLANTECH Organization</p>
            <h1>Fingerprint Confirmation Letter</h1>
            <p>
              Print this letter after capturing the thumb image. The enhanced panel is
              optimized for visual review, not forensic-grade biometric matching.
            </p>
          </div>

          <article className="letter" id="print-letter">
            <header className="letter__header">
              <div>
                <p className="letter__brand">ALLANTECH ORGANIZATION</p>
                <h2>Thumb Fingerprint Capture Record</h2>
              </div>
              <div className="letter__meta">
                <span>Date: {capturedAt || getTodayValue()}</span>
                <span>Ref: {documentRef || "Pending reference"}</span>
              </div>
            </header>

            <div className="letter__body">
              <p>To whom it may concern,</p>
              <p>
                This letter confirms that ALLANTECH has captured a thumb image for{" "}
                <strong>{applicantName || "Unnamed applicant"}</strong> for the purpose
                of <strong>{purpose || "fingerprint review"}</strong>.
              </p>
              <p>
                The image below was collected through a camera-assisted workflow and
                enhanced in-browser to improve ridge visibility for administrative review.
              </p>

              <div className="letter__images">
                <figure className="letter__figure">
                  <span>Original Capture</span>
                  {originalImage ? (
                    <NextImage
                      alt="Original thumb capture"
                      height={640}
                      src={originalImage}
                      unoptimized
                      width={480}
                    />
                  ) : (
                    <div className="letter__placeholder">No capture yet</div>
                  )}
                </figure>
                <figure className="letter__figure letter__figure--scan">
                  <span>Enhanced Scan Preview</span>
                  {enhancedImage ? (
                    <NextImage
                      alt="Enhanced fingerprint preview"
                      height={640}
                      src={enhancedImage}
                      unoptimized
                      width={480}
                    />
                  ) : (
                    <div className="letter__placeholder">No scan preview yet</div>
                  )}
                </figure>
              </div>

              <div className="letter__signoff">
                <p>Issued by: {issuedBy || "ALLANTECH Biometric Desk"}</p>
                <p>Signature: ______________________________</p>
              </div>
            </div>
          </article>

          <div className="stack-inline">
            <Button onClick={() => window.print()} type="button">
              Print Letter
            </Button>
            <Link className="button button--secondary" href="/register">
              Back To Capture
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid capture-layout">
      <section className="hero hero--compact">
        <p className="eyebrow">ALLANTECH Organization</p>
        <h1>Phone Camera Thumb Capture</h1>
        <p>
          Open this page on a phone, allow camera access, place the thumb close to the
          lens, and capture a print-ready fingerprint letter inside the same project.
        </p>
        <div className="hero__actions">
          <Button busy={busy} onClick={startCamera} type="button">
            Allow Camera
          </Button>
          <Link className="button button--secondary" href="/dashboard">
            View Letter
          </Link>
        </div>
      </section>

      <section className="card studio">
        <div className="card__header">
          <p className="eyebrow">Capture Form</p>
          <h2>Capture Details</h2>
          <p>Keep the lens clean, use bright light, and center the thumb inside the guide.</p>
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
          <div className="camera-frame">
            <video muted playsInline ref={videoRef} />
            <div className="camera-guide" />
            {!cameraReady ? (
              <div className="camera-frame__empty">
                Camera preview will appear here after permission is granted.
              </div>
            ) : null}
          </div>

          <div className="stack-inline">
            <Button disabled={!cameraReady} onClick={captureFingerprint} type="button">
              Capture Thumb
            </Button>
            <Button onClick={stopCamera} type="button" variant="secondary">
              Stop Camera
            </Button>
          </div>

          <p className={`status ${error ? "status--error" : "status--success"}`}>
            {error || status}
          </p>
        </div>
      </section>

      <section className="card results">
        <div className="card__header">
          <p className="eyebrow">Scan Result</p>
          <h2>Captured Thumb Panels</h2>
          <p>
            The enhanced version increases contrast to make ridge structure easier to
            inspect before printing.
          </p>
        </div>

        <div className="results__grid">
          <figure className="result-card">
            <span>Original</span>
            {originalImage ? (
              <NextImage
                alt="Original thumb photograph"
                height={640}
                src={originalImage}
                unoptimized
                width={480}
              />
            ) : (
              <div className="result-placeholder">No capture yet</div>
            )}
          </figure>
          <figure className="result-card">
            <span>Enhanced</span>
            {enhancedImage ? (
              <NextImage
                alt="Enhanced thumb scan"
                height={640}
                src={enhancedImage}
                unoptimized
                width={480}
              />
            ) : (
              <div className="result-placeholder">No enhanced scan yet</div>
            )}
          </figure>
        </div>

        <div className="stack-inline">
          <Link className="button button--primary" href="/dashboard">
            Generate Letter
          </Link>
        </div>
      </section>

      <canvas className="hidden-canvas" ref={captureCanvasRef} />
      <canvas className="hidden-canvas" ref={enhancedCanvasRef} />
    </div>
  );
}
