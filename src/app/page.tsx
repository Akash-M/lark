'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGame, randomCode, PALETTE } from '@/lib/useGameStore';
import { hasSupabase } from '@/lib/supabase';

export default function Lobby() {
  const router = useRouter();
  const configure = useGame((s) => s.configure);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  const [room, setRoom] = useState('');

  const go = () => {
    const n = name.trim() || 'Player';
    const c = (room || randomCode()).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    configure({ name: n, color, room: c, city: 'munich' });
    router.push('/play');
  };

  return (
    <main className="lobby">
      <div className="lobby-card">
        <h1>LARK <span>💙💗</span></h1>
        <p className="tag">Explore a 3D city together. Reunite, or race the clock to find landmarks.</p>

        <label>Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" maxLength={12} />

        <label>Colour</label>
        <div className="swatches">
          {PALETTE.map((c) => (
            <button key={c} className={`sw ${c === color ? 'sel' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`colour ${c}`} />
          ))}
        </div>

        <label>Room code</label>
        <input value={room} onChange={(e) => setRoom(e.target.value.toUpperCase())} placeholder="Join a code, or leave blank to create" maxLength={6} />

        <div className="row">
          <button className="big-btn blue wide" onClick={go}>{room.trim() ? 'Join room' : 'Create room'}</button>
        </div>

        <p className="hint">Share the room code with your partner so you land in the same city.</p>
        {!hasSupabase() && <p className="warn">No Supabase keys yet — you can explore solo. Add keys (see README) to play together.</p>}
        <p className="credit">City data © OpenStreetMap contributors (ODbL)</p>
      </div>
    </main>
  );
}
