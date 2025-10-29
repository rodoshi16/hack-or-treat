import { Button } from "@/components/ui/button";

interface FilterSelectorProps {
  selectedFilter: string | null;
  onFilterSelect: (filter: string) => void;
}

const filters = [
  { id: "vampire", emoji: "🧛", name: "Vampire Vibes", description: "Blood red tint with fangs" },
  { id: "zombie", emoji: "🧟", name: "Zombie Mode", description: "Decay and wounds" },
  { id: "ghost", emoji: "👻", name: "Ghostly", description: "Ethereal transparency" },
  { id: "pumpkin", emoji: "🎃", name: "Pumpkin Spice", description: "Orange Halloween glow" },
  { id: "witch", emoji: "🧙", name: "Witchy", description: "Purple magic aura" },
  { id: "demon", emoji: "😈", name: "Demon", description: "Hellfire and horns" },
  { id: "skeleton", emoji: "💀", name: "Skeleton", description: "Bone structure reveal" },
  { id: "possessed", emoji: "👹", name: "Possessed", description: "Dark energy swirls" },
];

export const FilterSelector = ({ selectedFilter, onFilterSelect }: FilterSelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-creepy text-primary mb-4">
        Choose Your Spooky Filter
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            onClick={() => onFilterSelect(filter.id)}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            className={`
              h-auto py-4 px-3 flex-col gap-2 spooky-hover
              ${selectedFilter === filter.id 
                ? "ring-2 ring-primary shadow-glow" 
                : "hover:border-primary/50"
              }
            `}
          >
            <span className="text-4xl">{filter.emoji}</span>
            <span className="text-xs font-semibold text-center leading-tight">
              {filter.name}
            </span>
          </Button>
        ))}
      </div>

      {selectedFilter && (
        <p className="text-sm text-center text-muted-foreground pt-2">
          {filters.find(f => f.id === selectedFilter)?.description}
        </p>
      )}
    </div>
  );
};
