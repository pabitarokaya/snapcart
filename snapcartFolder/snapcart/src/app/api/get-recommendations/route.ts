import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { getProductIndex } from "@/utils/invertedIndex";

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit") || "6");

    const groceries = await Grocery.find({});
    const plainGroceries = JSON.parse(JSON.stringify(groceries));

    const productIndex = getProductIndex();
    productIndex.buildIndex(plainGroceries);

    let recommendations;
    
    if (productId) {
      recommendations = productIndex.getRecommendations(productId, limit);
    } else {
      const shuffled = plainGroceries.sort(() => 0.5 - Math.random());
      recommendations = shuffled.slice(0, limit);
    }

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { message: `Error fetching recommendations: ${error}` },
      { status: 500 }
    );
  }
}