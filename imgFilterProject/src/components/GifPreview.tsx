interface GifPreviewProps {
  gifUrl: string;
}

export const GifPreview = ({ gifUrl }: GifPreviewProps) => {
  return (
    <div className="flex justify-center">
      <div className="relative max-w-md w-full aspect-square rounded-lg overflow-hidden border-4 border-primary/30 shadow-2xl spooky-hover">
        <img
          src={gifUrl}
          alt="Generated Halloween GIF"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
