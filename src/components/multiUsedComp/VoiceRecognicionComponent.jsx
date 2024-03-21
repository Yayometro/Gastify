

import React, { useState } from 'react'

function VoiceRecognicionComponent() {
    const [isRecording, setIsRecording] = useState(false)
    const recognition = new webkitspeechrecognition()
    recognition.continuous = true;
    recognition.lang = 'es-Es';
    //To cut the intermiate phrases
    recognition.interimResult = false;
  return (
    <div className=' w-full h-full'>
        <h1>Add transactions using your voice</h1>
            <button>Record</button>
            <p></p>
    </div>
  )
}

export default VoiceRecognicionComponent