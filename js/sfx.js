window.YD = window.YD || {};
YD._ac = null;
YD.sfxEnabled = true;
YD.ensureAudio = function () {
  if (!YD._ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) YD._ac = new AC();
  }
  if (YD._ac && YD._ac.state === 'suspended') YD._ac.resume();
  return YD._ac;
};
YD.beep = function (freq, dur, type, gain) {
  if (!YD.sfxEnabled) return;
  const ac = YD.ensureAudio();
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type || 'square';
  o.frequency.value = freq;
  g.gain.value = gain || 0.04;
  o.connect(g); g.connect(ac.destination);
  const t = ac.currentTime;
  g.gain.setValueAtTime(gain || 0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.1));
  o.start(t); o.stop(t + (dur || 0.1));
};
YD.sfx = {
  click() { YD.beep(420, 0.05, 'square', 0.03); },
  coin() { YD.beep(880, 0.08, 'triangle', 0.05); setTimeout(() => YD.beep(1175, 0.1, 'triangle', 0.04), 60); },
  gotcha() { YD.beep(220, 0.08, 'sawtooth', 0.05); setTimeout(() => YD.beep(440, 0.12, 'square', 0.05), 70); setTimeout(() => YD.beep(660, 0.15, 'triangle', 0.04), 150); },
  bad() { YD.beep(140, 0.2, 'sawtooth', 0.05); },
  raid() { YD.beep(90, 0.25, 'sawtooth', 0.06); setTimeout(() => YD.beep(70, 0.3, 'square', 0.05), 120); },
  upgrade() { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>YD.beep(f,0.12,'triangle',0.045), i*90)); },
  refuse() { YD.beep(300, 0.06, 'square', 0.03); },
};
