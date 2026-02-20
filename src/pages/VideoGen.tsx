import { VideoControls } from '@/components/video-gen/VideoControls';
import { VideoOutput } from '@/components/video-gen/VideoOutput';

export default function VideoGen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        <VideoControls />
        <VideoOutput />
      </div>
    </div>
  );
}
