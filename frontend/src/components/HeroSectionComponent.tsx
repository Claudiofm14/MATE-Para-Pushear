import React from 'react';
import { HeroSection } from '../modules/homepage/types/home.types';

interface HeroSectionComponentProps {
  hero: HeroSection;
}

export const HeroSectionComponent: React.FC<HeroSectionComponentProps> = ({
  hero,
}) => {
  return (
    <section className="relative overflow-hidden border-b border-blue-900/10 bg-gradient-to-r from-blue-700 via-blue-700 to-emerald-700 text-white">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "url('/grid-pattern.svg')" }}
      ></div>

      <div className="relative z-10 mx-auto max-w-screen-xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
        <h1 className="mb-3 text-4xl font-bold tracking-tight leading-tight text-white md:text-5xl">
          {hero.title}
        </h1>
        <p className="mx-auto max-w-3xl text-base font-medium leading-relaxed text-blue-50 md:text-lg">
          {hero.subtitle}
        </p>
      </div>
    </section>
  );
};
