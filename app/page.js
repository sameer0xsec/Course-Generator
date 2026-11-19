import { Button } from "@/components/ui/button";
import Image from "next/image";
import Header from "./_components/Header";
import Hero from "./_components/Hero";
import Footer from "./_components/Footer";

export const metadata = {
  title: 'AI Course Generator - Create Personalized Learning Paths',
  description: 'Transform education with AI-powered course creation. Generate personalized, engaging courses in minutes.',
  keywords: 'AI courses, course generator, personalized learning, educational technology, AI education',
  openGraph: {
    title: 'AI Course Generator - Create Personalized Learning Paths',
    description: 'Transform education with AI-powered course creation. Generate personalized, engaging courses in minutes.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
    {/* HEADER */}
    <Header/>

    {/* Hero Section */}
    <main className="flex-grow">
      <Hero/>
    </main>
    
    {/* Footer */}
    <Footer />
    </div>
    );
}
