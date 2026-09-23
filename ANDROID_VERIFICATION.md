# Android Verification Status

## Source-level verification
- Capacitor Android: 8.5.2
- compileSdk / targetSdk: 36
- minSdk: 24
- Camera permission: `android.permission.CAMERA`
- Location permissions: `ACCESS_COARSE_LOCATION` + `ACCESS_FINE_LOCATION`
- Camera flow: `navigator.mediaDevices.getUserMedia({ video: true })`
- GPS flow: `navigator.geolocation.getCurrentPosition()` with high accuracy and 100 m acceptance threshold
- Capacitor's Android `BridgeWebChromeClient` handles WebView camera and geolocation runtime permission callbacks.
- No `window.alert`, `window.confirm`, or `window.prompt` remains in application source.

## Registration photo
- Anonymous upload is allowed only under `profile-photos/registration/`.
- The `profile-photos` bucket remains private-read.
- Registration photo path is included in auth metadata so the database trigger can persist it even when email confirmation means no immediate session is returned.

## Build limitation in this audit environment
The project could not be compiled into APK/AAB in this container because:
1. Android SDK is not installed/available.
2. Gradle 8.14.3 distribution is not cached locally.
3. Network access to `services.gradle.org` is unavailable.

Therefore APK/AAB and physical-device testing remain **not verified** here. This is an environment limitation, not a claim that the Android source fails to compile.

## Required final device test
1. Install debug APK on a real Android 8+ device.
2. Login as employee.
3. Deny camera, retry, then allow camera.
4. Deny location, retry, then allow precise location.
5. Capture selfie and verify preview.
6. Capture GPS and verify accuracy display.
7. Clock in and clock out.
8. Background/resume the app during camera/GPS flow.
9. Test Android back button and keyboard on forms.
10. Test registration photo upload before email confirmation.
11. Build signed AAB and perform release smoke test.
