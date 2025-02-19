const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Configure ffmpeg path if needed
// ffmpeg.setFfmpegPath('/path/to/ffmpeg');
// ffmpeg.setFfprobePath('/path/to/ffprobe');

const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

exports.trimVideo = async (req, res) => {
  const { videoPath, startTime, endTime, outputFileName } = req.body;
  const outputPath = path.join(TEMP_DIR, outputFileName);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.mergeVideos = async (req, res) => {
  const { videos, outputFileName } = req.body;
  const outputPath = path.join(TEMP_DIR, outputFileName);

  try {
    const command = ffmpeg();
    
    // Add each video to the command
    videos.forEach(video => {
      command.input(video.path);
    });

    await new Promise((resolve, reject) => {
      command
        .on('end', resolve)
        .on('error', reject)
        .mergeToFile(outputPath, TEMP_DIR);
    });

    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateThumbnail = async (req, res) => {
  const { videoPath, time, outputFileName } = req.body;
  const outputPath = path.join(TEMP_DIR, outputFileName);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [time],
          filename: outputFileName,
          folder: TEMP_DIR,
          size: '320x240'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generatePreview = async (req, res) => {
  const { videoPath, outputFileName } = req.body;
  const outputPath = path.join(TEMP_DIR, outputFileName);

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .size('640x?')
        .fps(24)
        .videoBitrate('1000k')
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportVideo = async (req, res) => {
  const { clips, outputFileName, settings } = req.body;
  const outputPath = path.join(TEMP_DIR, outputFileName);

  try {
    const command = ffmpeg();
    
    // Process each clip
    for (const clip of clips) {
      command.input(clip.asset.url)
        .inputOptions([`-ss ${clip.start}`, `-t ${clip.end - clip.start}`]);
    }

    // Add filters based on settings
    const complexFilter = [];
    clips.forEach((_, index) => {
      complexFilter.push(`[${index}:v]scale=${settings.width}:${settings.height}[v${index}]`);
    });
    
    // Concatenate all videos
    complexFilter.push(
      `${clips.map((_, i) => `[v${i}]`).join('')}concat=n=${clips.length}:v=1[outv]`
    );

    await new Promise((resolve, reject) => {
      command
        .complexFilter(complexFilter, ['outv'])
        .outputOptions([
          `-c:v ${settings.codec || 'libx264'}`,
          `-b:v ${settings.bitrate || '2000k'}`,
          `-r ${settings.fps || 30}`
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    res.json({ success: true, outputPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};