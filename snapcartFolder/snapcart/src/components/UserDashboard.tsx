'use client'
import React, { useState, useEffect } from 'react'
import { motion } from "motion/react"
import HeroSection from './HeroSection'
import CategorySlider from './CategorySlider'
import GroceryItemCard from './GroceryItemCard'
import RecommendedProducts from './RecommendedProducts'
import { IGrocery } from '@/models/grocery.model'

interface UserDashboardProps {
  groceryList: IGrocery[]
}

function UserDashboard({ groceryList }: UserDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredGroceries, setFilteredGroceries] = useState<IGrocery[]>(groceryList);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const filterGroceries = async () => {
      if (!selectedCategory) {
        setFilteredGroceries(groceryList);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/get-groceries-by-category?category=${encodeURIComponent(selectedCategory)}`);
        const data = await response.json();
        setFilteredGroceries(data);
      } catch (error) {
        console.error('Error fetching filtered groceries:', error);
        const filtered = groceryList.filter(item => item.category === selectedCategory);
        setFilteredGroceries(filtered);
      } finally {
        setLoading(false);
      }
    };

    filterGroceries();
  }, [selectedCategory, groceryList]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  return (
    <>
      {/* YOUR ORIGINAL HERO SECTION */}
      <HeroSection />

      {/* Category Slider - Now clickable! */}
      <CategorySlider 
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      {/* Selected Category Badge */}
      {selectedCategory && (
        <motion.div
          className='w-[90%] md:w-[80%] mx-auto mt-6'
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className='flex items-center justify-center gap-2 bg-green-100 border-2 border-green-600 rounded-full px-6 py-2 w-fit mx-auto'>
            <span className='text-green-700 font-semibold'>Showing: {selectedCategory}</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className='ml-2 text-green-700 hover:text-green-900 font-bold'
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}

      {/* Popular Grocery Items */}
      <div className='w-[90%] md:w-[80%] mx-auto mt-10'>
        <h2 className='text-2xl md:text-3xl font-bold text-green-700 mb-6 text-center'>
          {selectedCategory ? `${selectedCategory} Products` : '🔥 Popular Grocery Items'}
        </h2>

        {loading ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='bg-gray-200 rounded-2xl h-80 animate-pulse' />
            ))}
          </div>
        ) : filteredGroceries.length > 0 ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6'>
            {filteredGroceries.map((item: any, index: number) => (
              <GroceryItemCard key={index} item={item} />
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <p className='text-xl text-gray-500'>No products found in this category</p>
            <button
              onClick={() => setSelectedCategory(null)}
              className='mt-4 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all'
            >
              View All Products
            </button>
          </div>
        )}
      </div>

      {/* Recommended Products */}
      {!selectedCategory && <RecommendedProducts limit={6} />}
    </>
  )
}

export default UserDashboard