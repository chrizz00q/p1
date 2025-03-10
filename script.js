        // Better Awareness Siren Script
        let audioContext;
        let oscillator;
        let gainNode;
        let sirenInterval;
        let startTime;
        const duration = 20000; // Duration in milliseconds (20 seconds)

        // Listen for changes to localStorage (which will notify us of tab changes)
        window.addEventListener('storage', (event) => {
            const data = JSON.parse(event.newValue);
            if (data && data.type === 'startAwarenessSiren') {
                startAwarenessSiren();
            } else if (data && data.type === 'stopAwarenessSiren') {
                stopAwarenessSiren();
            } else if (data && data.type === 'startFireAlarm') {
                startFireAlarm();
            } else if (data && data.type === 'stopFireAlarm') {
                stopFireAlarm();
            }
        });

        function startAwarenessSiren() {
            // Create a new AudioContext each time we start the siren
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create an oscillator node (tone generator)
            oscillator = audioContext.createOscillator();
            
            // Create a gain node (controls the volume)
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);

            // Connect oscillator to gainNode (to control volume)
            oscillator.connect(gainNode);

            // Start oscillator (main sound generator)
            oscillator.start();

            // Set initial gain to full volume
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime); // Start with a high volume for urgency

            // Start a repetitive siren pattern
            startTime = audioContext.currentTime;

            // Make the frequency oscillate between 500 Hz and 1500 Hz rapidly
            let frequencyCycleDuration = 0.5; // Time to complete one cycle of rising and falling frequency
            sirenInterval = setInterval(() => {
                let elapsedTime = audioContext.currentTime - startTime;

                // Alternate frequency between 500 Hz and 1500 Hz to simulate rapid rising and falling
                let freq = (elapsedTime % frequencyCycleDuration < frequencyCycleDuration / 2) 
                            ? 1500 
                            : 500;
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

                // Apply rapid volume modulation for a more dynamic effect
                let volume = 0.8 + 0.2 * Math.sin(elapsedTime * Math.PI * 4); // High frequency volume modulation
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

            }, 30); // Update every 30 ms for fast changes in frequency and volume

            // Stop the awareness siren after 20 seconds
            setTimeout(stopAwarenessSiren, duration); // Automatically stop the siren after 20 seconds

            // Broadcast to other tabs that the siren has started
            localStorage.setItem('alarmData', JSON.stringify({ type: 'startAwarenessSiren' }));
        }

        function stopAwarenessSiren() {
            if (audioContext) {
                clearInterval(sirenInterval);  // Stop the frequency and volume modulation interval
                gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Fade out the volume
                oscillator.stop(audioContext.currentTime + 1); // Stop the oscillator smoothly
                audioContext.close();  // Close the audio context to clean up
            }

            // Broadcast to other tabs that the siren has stopped
            localStorage.setItem('alarmData', JSON.stringify({ type: 'stopAwarenessSiren' }));
        }

        // Fire Alarm Script
        let fireAlarmInterval;

        function startFireAlarm() {
            // Create a new AudioContext each time we start the fire alarm
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create an oscillator node (tone generator)
            oscillator = audioContext.createOscillator();
            
            // Create a gain node (controls the volume)
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);

            // Set oscillator properties (square wave sound)
            oscillator.type = 'square'; // Square wave gives an alarm-like tone
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // Frequency of 1000 Hz

            // Connect oscillator to gainNode (to control volume)
            oscillator.connect(gainNode);
            
            // Start oscillator
            oscillator.start();

            // Set the volume to full
            gainNode.gain.setValueAtTime(1, audioContext.currentTime);

            // Create a repeating fire alarm pattern with gain node toggling
            fireAlarmInterval = setInterval(() => {
                // Alternate between loud and silent to simulate alarm
                if (gainNode.gain.value > 0) {
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime);  // Silence
                } else {
                    gainNode.gain.setValueAtTime(1, audioContext.currentTime);  // Loud
                }
            }, 500); // Toggle every 500 ms (0.5 seconds)

            // Stop the alarm after 20 seconds
            setTimeout(stopFireAlarm, 20000); // Stop the alarm after 20 seconds

            // Broadcast to other tabs that the fire alarm has started
            localStorage.setItem('alarmData', JSON.stringify({ type: 'startFireAlarm' }));
        }

        function stopFireAlarm() {
            if (audioContext) {
                clearInterval(fireAlarmInterval);  // Stop the interval that toggles the sound
                gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Immediately stop the sound
                oscillator.stop();  // Stop the oscillator
                audioContext.close();  // Close the audio context to clean up
            }

            // Broadcast to other tabs that the fire alarm has stopped
            localStorage.setItem('alarmData', JSON.stringify({ type: 'stopFireAlarm' }));
        }            
    // Automatic Theme Detection and Toggle
    const themeToggle = document.getElementById('theme-toggle');
    let darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    themeToggle.innerText = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    // Listener for theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      darkMode = event.matches;
      document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      themeToggle.innerText = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });

    // Toggle theme manually when button is clicked
    themeToggle.addEventListener('click', () => {
      darkMode = !darkMode;
      document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      themeToggle.innerText = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });

    // Highcharts Configuration for Distance Monitoring
    var chartT = new Highcharts.Chart({
      chart: { renderTo: 'chart-distance' },
      title: { text: 'Distance Monitoring' },
      series: [{ showInLegend: false, data: [] }],
      plotOptions: {
        line: { animation: false, dataLabels: { enabled: true } },
        series: { color: '#059e8a' }
      },
      xAxis: { type: 'datetime', dateTimeLabelFormats: { second: '%H:%M:%S' } },
      yAxis: { title: { text: 'Distance (CM)' }, gridLineColor: '#f0f0f0' },
      credits: { enabled: false }
    });

// Fetch distance data periodically and update the chart and LEDs every 3 seconds
setInterval(() => {
  fetch("/distance")
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      const x = (new Date()).getTime();
      const y = parseFloat(data.distance) || 0;
      
      // Ignore distance 0
      if (y === 0) return;

      chartT.series[0].addPoint([x, y], true, chartT.series[0].data.length > 40);
      updateLEDs(y, data.led);
      document.getElementById('buzzer-status').innerText = data.buzzer === "1" ? "Buzzer Status: On" : "Buzzer Status: Off";
      
    })
    .catch(error => console.error("Request failed: " + error));
}, 3000);  // Changed the interval to 3000 milliseconds (3 seconds)


    // Update LED indicators based on distance and server LED state
    function updateLEDs(distance, ledState) {
      const alertPopup = document.getElementById('alert-popup');
      const greenLED = document.getElementById('led-green');
      const yellowLED = document.getElementById('led-yellow');
      const redLED = document.getElementById('led-red');

      // Reset all LEDs to grey
      greenLED.className = 'led';
      yellowLED.className = 'led';
      redLED.className = 'led';

      // Reset the popup to hide it
      alertPopup.classList.remove('show');

      // Update LED states based on distance
      if (distance > 20) {
        greenLED.className += ' green'; // Safe zone
      } else if (distance > 10 && distance <= 20) {
        yellowLED.className += ' yellow'; // Warning zone
        alertPopup.textContent = 'Warning: Water level rising. Prepare for possible evacuation.';
        alertPopup.classList.add('show');
      } else {
        redLED.className += ' red'; // Danger zone
        alertPopup.textContent = 'Danger: Flooding imminent. Evacute immediately!';
        alertPopup.classList.add('show');
      }

      // Set LED state according to server response
      if (ledState === "green") {
        greenLED.className += ' green';
      } else if (ledState === "yellow") {
        yellowLED.className += ' yellow';
      } else if (ledState === "red") {
        redLED.className += ' red';
      }
    }

    const personHeightInches = 65;  
    const figureHeight = 580;  

    function updateFlood(value) {
        let fill = document.getElementById("fill");
        let measurementDisplay = document.getElementById("measurement");

        let inches = parseInt(value);
        if (isNaN(inches) || inches < 0) inches = 0;
        if (inches > personHeightInches) inches = personHeightInches;

        let feet = Math.floor(inches / 12);
        let remainingInches = inches % 12;
        measurementDisplay.innerText = `Flood Level: ${feet}' ${remainingInches}"`;

        let fillHeight = (inches / personHeightInches) * figureHeight;
        fill.style.height = `${Math.min(fillHeight, figureHeight)}px`;
    }
if (window.innerWidth < 1024) {
  document.querySelector("meta[name=viewport]").setAttribute("content", "width=1024");
}
