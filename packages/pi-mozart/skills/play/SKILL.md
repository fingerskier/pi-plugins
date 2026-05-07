---
name: play
description: "Load and explore MIDI files. Analyze structure, navigate measures, search for notes, and display musical content."
---

# /play — Load & Explore MIDI Files

Use the Mozart Pi tools to load, inspect, and navigate MIDI files.

## Quick Start

```
/play song.mid
```

## Workflow

1. **Load the file** with `mozart_load_midi` — provide the path and an optional alias
2. **Inspect** with `mozart_midi_info` — see tracks, instruments, tempo, time signature
3. **Browse measures** with `mozart_get_measures` — view notes by measure number
4. **Search** with `mozart_search_notes` — find notes by pitch, track, or range

## Examples

### Load and summarize
```
mozart_load_midi file_path="song.mid" alias="song"
mozart_midi_info alias="song"
```

### Show measures 1-8 of track 0
```
mozart_get_measures alias="song" start_measure=1 end_measure=8 track=0
```

### Find all C notes in the melody
```
mozart_search_notes alias="song" note_name="C" track=0
```

### Show measures around a key change
```
mozart_get_measures alias="song" start_measure=33 end_measure=36
```

## Tool Reference

| Tool | Purpose |
|------|---------|
| `mozart_load_midi` | Parse a .mid file and load it into memory |
| `mozart_midi_info` | Show tempo, time sig, tracks, instruments, pitch ranges |
| `mozart_get_measures` | Get notes organized by measure (tempo/time-sig aware) |
| `mozart_search_notes` | Search notes by pitch, name, track, or measure range |
| `mozart_list_loaded` | Show all loaded MIDI files |
| `mozart_unload_midi` | Remove a file from memory |

## Tips

- Use short aliases (e.g. "song", "bass") to make commands readable
- Browse a few measures at a time — large ranges produce a lot of output
- Use `mozart_search_notes` to find specific patterns before editing
- Track indices are 0-based — check `mozart_midi_info` to see what's on each track
