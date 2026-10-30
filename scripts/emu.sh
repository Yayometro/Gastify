#!/bin/zsh
# Helper to drive the Android emulator (emulator-5554) that runs the real Gastify app. Used by test agents.
#   scripts/emu.sh launch              start the app (dev client, Metro must run on :8081)
#   scripts/emu.sh shot [name]         screenshot downscaled to 540px wide -> prints the PNG path (read it with the Read tool)
#   scripts/emu.sh tap X Y             tap, in FULL-resolution pixels (1080x2400); shot images are 0.5x, so multiply their coordinates by 2
#   scripts/emu.sh swipe X1 Y1 X2 Y2 [ms]
#   scripts/emu.sh text "hello"        type into the focused field (spaces are escaped)
#   scripts/emu.sh key BACK|ENTER|TAB|HOME
#   scripts/emu.sh login               sign in with the shared QA account from .env.test-account.local (+ TOTP if asked: run `login2fa`)
#   scripts/emu.sh login2fa            type the current TOTP code into the focused field
set -e
ADB=/opt/homebrew/share/android-commandlinetools/platform-tools/adb
ROOT="${0:A:h:h}"
OUT="${EMU_OUT:-/tmp/gastify-emu}"
mkdir -p "$OUT"

case "$1" in
  launch) $ADB shell am start -n com.yayometro.gastify/.MainActivity ;;
  shot)
    name="${2:-shot}"
    $ADB exec-out screencap -p > "$OUT/$name.png"
    sips -Z 1200 "$OUT/$name.png" --out "$OUT/$name-s.png" >/dev/null 2>&1
    sips --resampleWidth 540 "$OUT/$name.png" --out "$OUT/$name-s.png" >/dev/null 2>&1
    echo "$OUT/$name-s.png" ;;
  tap) $ADB shell input tap "$2" "$3" ;;
  swipe) $ADB shell input swipe "$2" "$3" "$4" "$5" "${6:-300}" ;;
  text) $ADB shell input text "${2// /%s}" ;;
  key) $ADB shell input keyevent "KEYCODE_$2" ;;
  login)
    set -a; . <(grep '^SHARED_QA_EMAIL\|^SHARED_QA_PASSWORD' "$ROOT/.env.test-account.local"); set +a
    # Assumes the login screen is showing. Tap the email field once (the keyboard then moves the layout), TAB to the password.
    $ADB shell input tap 540 1362; sleep 1
    $ADB shell input keyevent KEYCODE_CTRL_LEFT >/dev/null 2>&1 || true
    $ADB shell input text "$SHARED_QA_EMAIL"
    $ADB shell input keyevent KEYCODE_TAB
    $ADB shell input text "$SHARED_QA_PASSWORD"
    $ADB shell input keyevent KEYCODE_ENTER ;;
  login2fa) $ADB shell input text "$(node "$ROOT/scripts/qa-totp.mjs")" ;;
  *) echo "usage: see header of $0"; exit 1 ;;
esac
