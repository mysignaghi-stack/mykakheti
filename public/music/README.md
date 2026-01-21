# Music Files for Congratulations Cards

This directory contains audio files used for congratulations card music playback.

## Required Audio Files

The following audio files are referenced in the application:

- `mravaljamieri.mp3` - მრავალჟამიერი (Many Years - traditional Georgian toast song)
- `kakhetian_folk.mp3` - კახური ხალხური (Kakhetian folk music)
- `traditional_toast.mp3` - ტრადიციული სადღეგრძელო (Traditional Georgian toast music)

## Audio File Requirements

- **Format**: MP3 (recommended for broad browser compatibility)
- **Quality**: 128-192 kbps bitrate
- **Length**: 30-60 seconds (will loop automatically)
- **Volume**: Normalized to consistent levels
- **License**: Ensure you have rights to use the music

## Current Status

The files currently exist as placeholders. Replace them with actual audio files to enable music playback.

## Adding New Music

1. Add the audio file to this directory
2. Update the `MUSIC_OPTIONS` array in `/app/community/congratulations/submit/page.tsx`
3. Test the playback functionality

## Troubleshooting

If music doesn't play:
- Check browser console for errors
- Verify file format and encoding
- Ensure file is not corrupted
- Check browser audio permissions