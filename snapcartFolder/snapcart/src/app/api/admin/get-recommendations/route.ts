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

    // Get all groceries
    const groceries = await Grocery.find({});
    const plainGroceries = JSON.parse(JSON.stringify(groceries));

    // Build inverted index
    const productIndex = getProductIndex();
    productIndex.buildIndex(plainGroceries);

    let recommendations;
    
    if (productId) {
      // Get recommendations based on specific product
      recommendations = productIndex.getRecommendations(productId, limit);
    } else {
      // Get random popular products if no productId
      const shuffled = plainGroceries.sort(() => 0.5 - Math.random());
      recommendations = shuffled.slice(0, limit);
    }

    return NextResponse.json(recommendations, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Error fetching recommendations: ${error}` },
      { status: 500 }
    );
  }
}