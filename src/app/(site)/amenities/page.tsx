import type { Metadata } from "next";
import {
  BookOpen,
  Car,
  Dumbbell,
  Flame,
  Sun,
  TreePine,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import { IMAGES } from "@/lib/images";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Amenities",
  description:
    "Cellar spa with plunge pool and sauna, wood-fired restaurant, library, wine cellar, marked hiking trails from the gate, terrace, free parking and EV charging.",
};

const AMENITIES = [
  {
    icon: Flame,
    title: "Cellar spa",
    body: "A plunge pool, cedar sauna and two treatment rooms in the vaulted cellars. Book treatments a day ahead at the front desk.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurant Vatra",
    body: "Dinner over oak embers, breakfast until 10:30. Tables are held for house guests until 19:00 each evening.",
  },
  {
    icon: Wine,
    title: "The Cellar Bar",
    body: "Forty Romanian wines, a short list of plum brandies and the warmest corner in the house. Open from 16:00 to midnight.",
  },
  {
    icon: BookOpen,
    title: "The library",
    body: "Two thousand volumes, deep armchairs and the fire lit at six. Take any book to your room; return it when you leave, or on your next stay.",
  },
  {
    icon: TreePine,
    title: "Trails from the gate",
    body: "Four marked routes from 40 minutes to a full day, mapped on paper at the desk. In winter we track a route to the sledding slope.",
  },
  {
    icon: Sun,
    title: "The terrace",
    body: "South-facing over the valley. Braziers at dusk, blankets on every chair, and the best table for a slow afternoon coffee.",
  },
  {
    icon: Dumbbell,
    title: "Fitness room",
    body: "Small and honest: a rower, a rack of dumbbells, a bike and a view of the forest. Open around the clock with your room key.",
  },
  {
    icon: Car,
    title: "Parking and charging",
    body: "Free guest parking by the gatehouse and two 22 kW EV chargers. Airport and station transfers arranged at booking or any time after.",
  },
];

export default function AmenitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Amenities"
        title="Everything you need, nothing for show"
        lede="The castle earns its keep with a short list of things done properly: a spa in the old cellars, one very good restaurant, a bar worth staying in for, and the forest itself."
        image={IMAGES.fireplaceLounge}
        imageAlt="The lounge fireplace with armchairs and tall windows"
      />
      <section className="py-16 md:py-24">
        <div className="site-container grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {AMENITIES.map((item, index) => (
            <Reveal key={item.title} delay={(index % 4) * 0.08}>
              <item.icon className="h-6 w-6 text-brass" aria-hidden />
              <h2 className="mt-4 font-display text-xl font-medium">{item.title}</h2>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-parchment-dim">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
