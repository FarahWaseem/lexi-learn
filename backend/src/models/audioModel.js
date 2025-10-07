const transcripts = {};

exports.saveTranscript = (day, idx, text) => {
    const key = `${day}-${idx}`;
    transcripts[key] = text;
};

exports.getTranscript = (day, idx) => {
    const key = `${day}-${idx}`;
    return transcripts[key] || null;
};