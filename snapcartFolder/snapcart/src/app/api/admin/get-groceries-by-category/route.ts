import Grocery from "@/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { message: "Category parameter is required" },
        { status: 400 }
      );
    }

    // Find groceries by category
    const groceries = await Grocery.find({ category: category });

    return NextResponse.json(groceries, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: `Error fetching groceries by category: ${error}` },
      { status: 500 }
    );
  }
}