import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Ghost } from "lucide-react";

interface Member {
  name: string;
  role: string;
  imageSrc: string;
  linkedin: string;
}

const members: Member[] = [
    {
        name: "Rodoshi Mondal",
        role: "Hacker & Developer",
        imageSrc: "/Rodoshi_image.jpeg",
        linkedin: "https://www.linkedin.com/in/rodoshi-mondal/",
    },
    {
        name: "Kimi An",
        role: "Hacker & Developer",
        imageSrc: "/kimi_image.jpeg",
        linkedin: "https://www.linkedin.com/in/kimi-an/",
    },
    {
        name: "Thanh Nguyen",
        role: "Hacker & Developer",
        imageSrc: "/Thanh.png",
        linkedin: "https://www.linkedin.com/in/thanh-nguyen-ho-tien-54b835271/",
    },
];

const Teams = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Top Navigation (same as home) */}
        <nav className="flex items-center justify-between mb-6">
          <a href="/" className="flex items-center gap-2">
            <Ghost className="w-6 h-6 text-primary" />
            <span className="font-creepy text-2xl text-primary">Hack-or-Treat</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/teams" className="text-muted-foreground hover:text-primary transition-colors">Teams</a>
            <a href="mailto:contact@hackortreat.dev" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </div>
        </nav>
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Ghost className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-creepy text-primary text-glow">Meet the Team</h1>
            <Ghost className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Three brave souls behind the spooky magic.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <Card key={m.name} className="p-5 border-2 border-primary/20 hover:border-primary/40 transition-all spooky-hover">
              <div className="aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted">
                <img src={m.imageSrc} alt={m.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-semibold">{m.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{m.role}</p>
              <Button asChild variant="secondary" className="w-full">
                <a href={m.linkedin} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect on LinkedIn
                </a>
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teams;


