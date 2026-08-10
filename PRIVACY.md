# LeafScan privacy notes

LeafScan is designed to work without an account or application-level network service.

## Data processed

- Camera and gallery photos selected by the user.
- The model's local score, class identifier, scan time, and result-safety state.
- The user's English or Hindi interface preference.

## Where data stays

TensorFlow Lite inference runs on the device. LeafScan does not upload scan photos or model results. Up to 50 scan summaries and app-owned copies of their images are kept in the app's private local storage so the Field notebook can reopen them.

Clearing the Field notebook removes its stored summaries and the managed image directory. LeafScan never deletes the user's original gallery photo.

## Permissions

- Camera access is requested only after the user chooses to grant it.
- Photo-library access is requested when the user chooses a gallery image.
- Microphone permission is explicitly blocked because LeafScan does not record audio.

## Third-party services

The application currently includes no analytics, advertising, account, crash-reporting, or remote diagnosis service. Build tooling may contact npm, Expo, GitHub, Google, or Apple during development and release; that is separate from app scan processing.

Any future telemetry, cloud sync, remote model update, account, or image-upload feature must update this document and obtain the required user choice before data leaves the device.
