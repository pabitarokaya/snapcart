'use client'
import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import GroceryItemCard from './GroceryItemCard'
import { Sparkles } from 'lucide-react'

interface IGrocery {
    _id: string,
    name: string,
    category: string,
    price: string,
    unit: string,
    image: string,
}

interface RecommendedProductsProps {
  currentProductId?: string;
  limit?: number;
}

function RecommendedProducts({ currentProductId, limit = 6 }: RecommendedProductsProps) {
  const [recommendations, setRecommendations] = useState<IGrocery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const url = currentProductId
          ? `/api/get-recommendations?productId=${currentProductId}&limit=${limit}`
          : `/api/get-recommendations?limit=${limit}`;
        
        const response = await fetch(url);
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, limit]);

  if (loading) {
    return (
      <motion.div
        className='w-[90%] md:w-[80%] mx-auto mt-16'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className='flex items-center justify-center gap-2 mb-6'>
          <Sparkles className='w-6 h-6 text-green-600' />
          <h2 className='text-2xl md:text-3xl font-bold text-green-700 text-center'>
            Recommended for You
          </h2>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='bg-gray-200 rounded-2xl h-64 animate-pulse' />
          ))}
        </div>
      </motion.div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      className='w-[90%] md:w-[80%] mx-auto mt-16'
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: false, amount: 0.3 }}
    >
      <div className='flex items-center justify-center gap-2 mb-6'>
        <Sparkles className='w-6 h-6 text-green-600 animate-pulse' />
        <h2 className='text-2xl md:text-3xl font-bold text-green-700 text-center'>
          Recommended for You
        </h2>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6'>
        {recommendations.map((item) => (
          <GroceryItemCard key={item._id} item={item} />
        ))}
      </div>
    </motion.div>
  )
}

export default RecommendedProducts