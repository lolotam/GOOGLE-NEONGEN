import { ImageControls } from '@/components/image-gen/ImageControls';
import { ImageOutput } from '@/components/image-gen/ImageOutput';
import { ImageHistory } from '@/components/image-gen/ImageHistory';

export default function ImageGen() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        <ImageControls />
        <ImageOutput />
      </div>
      <ImageHistory />
    </div>
  );
}
