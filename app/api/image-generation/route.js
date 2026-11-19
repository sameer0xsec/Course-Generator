import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { courseTitle, category } = await request.json();

    // Validate input
    if (!courseTitle || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: courseTitle and category' },
        { status: 400 }
      );
    }

    const prompt = `${courseTitle} ${category} educational course cover 3d digital art`;
    const encodedPrompt = encodeURIComponent(prompt);
    const width = 1600;
    const height = 900;
    const randomSeed = Math.floor(Math.random() * 1000000);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${randomSeed}`;

    return NextResponse.json({
      imageUrl,
      prompt,
      width,
      height,
    });
  } catch (error) {
    console.error('Error generating image URL:', error);
    return NextResponse.json({
      imageUrl: '/guide-book.png',
      fallback: true,
      error: error.message,
    }, { status: 200 });
  }
}
