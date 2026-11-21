import { useRef, useState } from 'react';
import { Camera, ScanFace, CheckCircle2, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

/**
 * Owner liveness + face verification.
 * Uses the device camera (getUserMedia) when available, else file uploads.
 * Submits multipart to POST /owner/face-verify which forwards to the Python AI service.
 */
export default function OwnerFaceLivenessModal({ onClose, onSubmitted }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [idCardType, setIdCardType] = useState('AADHAAR');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setError('Camera unavailable — upload a selfie file instead.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => setSelfieBlob(blob), 'image/jpeg', 0.92);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const submit = async () => {
    if (!selfieBlob || !idCard) { setError('Capture/upload a selfie and the Govt ID image.'); return; }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('live_selfie', selfieBlob, 'selfie.jpg');
      form.append('id_card_image', idCard);
      form.append('id_card_type', idCardType);
      const { data } = await api.post('/owner/face-verify', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      onSubmitted?.(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Owner Verification — Face & Liveness Check" onClose={onClose}>
      {result ? (
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h3 className="mt-3 font-bold text-slate-800">Verification submitted</h3>
          <p className="mt-1 text-sm text-slate-500">{result.message}</p>
          {result.ai && (
            <p className="mt-2 text-xs text-slate-400">
              AI match score: {result.ai.ai_match_score ?? 'pending manual review'} · Liveness: {String(result.ai.liveness_passed)}
            </p>
          )}
          <button className="btn-primary mt-4" onClick={onClose}>Done</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center">
            {selfieBlob ? (
              <img src={URL.createObjectURL(selfieBlob)} alt="Selfie preview" className="mx-auto h-36 rounded-xl object-cover" />
            ) : stream ? (
              <video ref={videoRef} autoPlay playsInline className="mx-auto h-44 rounded-xl" />
            ) : (
              <button onClick={startCamera} className="btn-outline w-full"><Camera size={18} /> Start live camera</button>
            )}
            <canvas ref={canvasRef} className="hidden" />
            {stream && <button onClick={capture} className="btn-primary mt-3"><ScanFace size={18} /> Capture selfie (look straight)</button>}
            {!selfieBlob && <input type="file" accept="image/*" capture="user" className="mt-2 block w-full text-xs text-slate-500" onChange={(e) => setSelfieBlob(e.target.files?.[0] || null)} />}
          </div>

          <div>
            <label className="label" htmlFor="id-type">Govt ID type</label>
            <select id="id-type" value={idCardType} onChange={(e) => setIdCardType(e.target.value)} className="input">
              {['AADHAAR', 'PAN', 'VOTER_ID', 'PASSPORT', 'DRIVING_LICENSE'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input type="file" accept="image/*" className="mt-2 block w-full text-xs text-slate-500" onChange={(e) => setIdCard(e.target.files?.[0] || null)} aria-label="Upload Govt ID photo" />
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button onClick={submit} disabled={busy} className="btn-primary w-full">
            {busy ? <><Loader2 className="animate-spin" size={18} /> Verifying with AI…</> : 'Submit for verification'}
          </button>
          <p className="text-center text-[10px] text-slate-400">Your images are used only to verify ownership and are reviewed by pRent Admin.</p>
        </div>
      )}
    </Modal>
  );
}
