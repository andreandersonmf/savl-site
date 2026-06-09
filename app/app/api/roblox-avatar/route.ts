import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")

  if (!userId || !/^\d+$/.test(userId)) {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
      {
        method: "GET",
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return NextResponse.json({ imageUrl: null }, { status: 200 })
    }

    const data = await response.json()
    const imageUrl = data?.data?.[0]?.imageUrl ?? null

    return NextResponse.json({ imageUrl })
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}