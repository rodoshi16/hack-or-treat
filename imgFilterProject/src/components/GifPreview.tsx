import { DSAQuizGatekeeper } from "./DSAQuizGatekeeper";

interface GifPreviewProps {
  gifUrl: string;
}

export const GifPreview = ({ gifUrl }: GifPreviewProps) => {
  // Check if it's a video based on our marker
  const isVideo = gifUrl.includes('#video');
  const cleanUrl = gifUrl.replace('#video', '');
  console.log("isVideo: ", isVideo);
  console.log("gifUrl: ", gifUrl);
  
  return (
    <DSAQuizGatekeeper contentType="Jumpscare Video">
      <div className="flex justify-center">
        <div className="relative max-w-md w-full aspect-square rounded-lg overflow-hidden border-4 border-primary/30 shadow-2xl spooky-hover">
          {isVideo ? (
            <video
              src={cleanUrl}
              autoPlay
              muted
              className="w-full h-full object-cover"
              controls={false}
            />
          ) : (
            <img
              src={cleanUrl}
              alt="Generated Halloween GIF"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </DSAQuizGatekeeper>
  );
};
