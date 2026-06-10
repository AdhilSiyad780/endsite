// src/components/VariantSelector.jsx

import { useState, useEffect, useMemo } from 'react'

export default function VariantSelector({ variants = [], onSelect }) {
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize,  setSelectedSize]  = useState(null)


  // ── Derive unique colors from all variants ─────────────────────────────────

  const allColors = useMemo(() => {
    const seen = new Set()
    return variants
      .filter((v) => v.color && !seen.has(v.color) && seen.add(v.color))
      .map((v) => v.color)
  }, [variants])


  // ── Derive sizes available for the selected color ──────────────────────────

  const availableSizes = useMemo(() => {
    if (!selectedColor) return []
    const seen = new Set()
    return variants
      .filter((v) => v.color === selectedColor && v.size && !seen.has(v.size) && seen.add(v.size))
      .map((v) => v.size)
  }, [variants, selectedColor])


  // ── Get the full variant object for the selected color + size ──────────────

  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    ) ?? null
  }, [variants, selectedColor, selectedSize])


  // ── Is a specific size in stock for the selected color ─────────────────────

  const isSizeInStock = (size) => {
    const variant = variants.find(
      (v) => v.color === selectedColor && v.size === size
    )
    return variant ? variant.stock > 0 : false
  }


  // ── Is a color available in any stock ──────────────────────────────────────

  const isColorAvailable = (color) => {
    return variants.some((v) => v.color === color && v.stock > 0)
  }


  // ── Auto-select first color on mount ──────────────────────────────────────

  useEffect(() => {
    if (allColors.length > 0 && !selectedColor) {
      setSelectedColor(allColors[0])
    }
  }, [allColors])


  // ── Reset size when color changes ──────────────────────────────────────────

  useEffect(() => {
    setSelectedSize(null)
  }, [selectedColor])


  // ── Notify parent of selection ─────────────────────────────────────────────

  useEffect(() => {
    onSelect?.(selectedVariant)
  }, [selectedVariant])


  // ── Handle no variants ─────────────────────────────────────────────────────

  if (!variants || variants.length === 0) {
    return (
      <p className="text-[12px] uppercase tracking-wider text-brand-grey-500">
        No variants available
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Color selector ────────────────────────────────────────────────────── */}
      {allColors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label">
              Color
            </label>
            {selectedColor && (
              <span className="text-[12px] text-brand-900 uppercase tracking-wider">
                {selectedColor}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {allColors.map((color) => {
              const available = isColorAvailable(color)
              const selected  = selectedColor === color

              return (
                <button
                  key={color}
                  onClick={() => available && setSelectedColor(color)}
                  disabled={!available}
                  title={available ? color : `${color} — out of stock`}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${selected
                      ? 'border-black scale-110'
                      : 'border-transparent hover:border-brand-grey-500'
                    }
                    ${!available ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ backgroundColor: color?.toLowerCase() ?? '#ccc' }}
                >
                  {/* Out of stock diagonal line */}
                  {!available && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-[1px] h-full bg-brand-grey-500 rotate-45 block" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}


      {/* ── Size selector ─────────────────────────────────────────────────────── */}
      {selectedColor && availableSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="input-label">
              Size
            </label>
            {selectedSize && (
              <span className="text-[12px] text-brand-900 uppercase tracking-wider">
                Selected: {selectedSize}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const inStock  = isSizeInStock(size)
              const selected = selectedSize === size
              const variant  = variants.find(
                (v) => v.color === selectedColor && v.size === size
              )
              const price = variant?.price_override ?? null

              return (
                <button
                  key={size}
                  onClick={() => inStock && setSelectedSize(size)}
                  disabled={!inStock}
                  className={`relative w-[52px] h-[52px] flex flex-col items-center
                    justify-center text-[12px] uppercase tracking-wider border
                    transition-all duration-200
                    ${selected
                      ? 'border-black bg-black text-white'
                      : inStock
                        ? 'border-brand-grey-200 text-brand-900 hover:border-black'
                        : 'border-brand-grey-200 text-brand-grey-200 cursor-not-allowed'
                    }`}
                >
                  {/* Out of stock line-through */}
                  {!inStock ? (
                    <span className="line-through opacity-40">{size}</span>
                  ) : (
                    <span>{size}</span>
                  )}

                  {/* Price override indicator */}
                  {price && inStock && (
                    <span className={`text-[9px] mt-0.5 leading-none
                      ${selected ? 'text-white/70' : 'text-brand-grey-500'}`}>
                      ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}


      {/* ── Selected variant info ──────────────────────────────────────────────── */}
      {selectedVariant && (
        <div className="flex items-center justify-between pt-2
          border-t border-brand-grey-200">

          {/* Stock level */}
          <p className={`text-[11px] uppercase tracking-wider
            ${selectedVariant.stock <= 5
              ? 'text-red-600'
              : 'text-brand-grey-500'
            }`}
          >
            {selectedVariant.stock <= 0
              ? 'Out of stock'
              : selectedVariant.stock <= 5
                ? `Only ${selectedVariant.stock} left`
                : 'In stock'
            }
          </p>

          {/* SKU */}
          <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
            SKU: {selectedVariant.sku}
          </p>

        </div>
      )}


      {/* ── No size selected prompt ────────────────────────────────────────────── */}
      {selectedColor && availableSizes.length > 0 && !selectedSize && (
        <p className="text-[11px] uppercase tracking-wider text-brand-grey-500 -mt-3">
          Please select a size
        </p>
      )}

    </div>
  )
}