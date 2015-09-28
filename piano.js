/**
 * piano.js
 *
 * the logic of the simple html5 piano
 * using the Web Audio API
 */

(function () {
  // Thanks stackoverflow
  function triggerMouseEvent (node, eventType) {
    var clickEvent = document.createEvent ('MouseEvents');
    clickEvent.initEvent (eventType, true, true);
    node.dispatchEvent (clickEvent);
  }

  // Get synth
  var mySynth = new AudioSynth();
  var myInstrument = mySynth.createInstrument(0);

  var musicScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var noSharps = {'E': 0, 'B': 0};

  var keyboardStatus = {
    'pedal': false,
    'sharp': false
  }

  // Keyboard Mapping for US international
  var keyboardMapping = {

  };

  var keyboardKeys = "1234567890½»QWERTYUIOPÝÛASDFGHJKLºÞÜÀZXCVBNM¼¾¿"

  var tonePattern = new RegExp("^([CDEFGAB][#♭]?)$");
  var sharpFlatPattern = new RegExp("([#♭])");

  function updateVolume(newValue) {
    mySynth.setVolume(newValue/100);
  }

  function getKeybuttonForKeystring(keyString) {
    if(!(keyString in keyboardMapping)) {
      return null;
    }

    var tonePlayed = keyboardMapping[keyString].tone + (keyboardStatus.sharp ? '#' : '');
    var keyForTone = document.querySelector('[oct="' + keyboardMapping[keyString].oct + '"][tone="' + tonePlayed + '"]')
    return keyForTone;
  }

  function handleKeyDown(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    if(charCode === 32) {
      keyboardStatus.pedal = true;
    } else if(charCode === 16) {
      keyboardStatus.sharp = true;
    } else {
      var pressedKey = String.fromCharCode(charCode).toUpperCase();

      keyForTone = getKeybuttonForKeystring(pressedKey);
      if(keyForTone !== null) {
        triggerMouseEvent(keyForTone, "mousedown");
      }
    }
  }

  function handleKeyUp(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    if(charCode === 32) {
      keyboardStatus.pedal = false;

    } else if(charCode === 16) {
      keyboardStatus.sharp = false;
    } else {
      var pressedKey = String.fromCharCode(charCode).toUpperCase();
      keyForTone = getKeybuttonForKeystring(pressedKey);

      if(keyForTone !== null && keyForTone.getAttribute('pressed') === 'true') {
        triggerMouseEvent(keyForTone, "mouseup");
      }
    }
  }

  function playTone(tone, oct) {
    tone[0] = tone[0].toUpperCase();
    if(!tonePattern.test(tone))
      return;

    // Catch flat
    if(tone[1] == '♭') {
      tone[0] = musicScale[musicScale.indexOf(tone[1].toUpperCase()) - 1];
      tone[1] = '#';
    }

    return mySynth.play('piano', tone, oct, 4);
  }

  function createKey(tone, oct) {
    var newKey = document.createElement('button');
    newKey.setAttribute('oct', oct);
    newKey.setAttribute('tone', tone);
    newKey.setAttribute('pressed', false);
    newKey.innerHTML = tone + oct;
    newKey.className = 'key';

    if(sharpFlatPattern.test(tone)) {
      newKey.className += ' sharpFlat';
    }
    newKey.currentTone = null;

    newKey.onmousedown = function () {
      newKey.setAttribute('pressed', true);
      newKey.currentTone = playTone(tone, oct);
    };

    newKey.onmouseup = function() {
      if(newKey.currentTone !== null) {
        var fadeOutInterval = setInterval(function () {
          function cleanupInterval() {
            clearInterval(fadeOutInterval);
            newKey.setAttribute('pressed', false);
            newKey.currentTone = null;
          }
          if(newKey.currentTone === null || newKey.currentTone.ended) {
            cleanupInterval();
            return;
          }

          if(keyboardStatus.pedal) {
            return;
          }

          if(newKey.currentTone.volume > 0.05) {
            newKey.currentTone.volume -= 0.05;
          }
          else if(newKey.currentTone.volume <= 0.05) {
            newKey.currentTone.pause();
            cleanupInterval();
          }
        }, 50);
      }
    }

    return newKey;
  }

  function addNewKeybinding(tone, oct) {
    if(Object.keys(keyboardMapping).length >= keyboardKeys.length) {
      console.error('No more keys available');
      return;
    }

    var keyString = keyboardKeys[Object.keys(keyboardMapping).length];
    keyboardMapping[keyString] = {oct: oct, tone: tone};
  }

  function createOctave(pianoNode, oct) {
    musicScale.forEach(function (tone) {
      pianoNode.appendChild(createKey(tone, oct));
      addNewKeybinding(tone, oct);

      if(!(tone in noSharps)) {
        pianoNode.appendChild(createKey(tone + '#', oct));
//        addNewKeybinding(tone + '#', oct);
      }
    });
  }

  function createKeyboard(pianoId) {
    var pianoNode = document.getElementById(pianoId);

    var minOct = 1;
    var maxOct = 7;

    for(var oct = minOct; oct <= maxOct; ++oct) {
      createOctave(pianoNode, oct);
    }
  }

  window.addEventListener('load', function() {
    createKeyboard('piano');
    document.getElementById('volumeSlider').onchange = function () {
      updateVolume(document.getElementById('volumeSlider').value);
      document.getElementById('volumeValue').innerHTML = document.getElementById('volumeSlider').value;
    }
    document.getElementById('volumeValue').innerHTML = document.getElementById('volumeSlider').value;
  });

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

})();
