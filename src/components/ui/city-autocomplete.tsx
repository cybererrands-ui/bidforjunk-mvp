"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchCities, formatCityProvince, type CanadianCity } from "@/lib/canadian-cities";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SINGLE-SELECT MODE                                                 */
/* ------------------------------------------------------------------ */

interface SingleProps {
  mode: "single";
  value: string; // city name
  province?: string; // auto-filled province code
  onChange: (city: string, province: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  MULTI-SELECT MODE                                                  */
/* ------------------------------------------------------------------ */

interface MultiProps {
  mode: "multi";
  value: string[]; // array of city names
  onChange: (cities: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

type CityAutocompleteProps = SingleProps | MultiProps;

export function CityAutocomplete(props: CityAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CanadianCity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // For single mode, keep the input in sync with the value
  useEffect(() => {
    if (props.mode === "single" && props.value && !isOpen) {
      setQuery(props.value);
    }
  }, [props.mode, props.mode === "single" ? props.value : null, isOpen]);

  const search = useCallback((q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const matches = searchCities(q, 8);
    setResults(matches);
    setIsOpen(matches.length > 0);
    setHighlightIndex(-1);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const selectCity = (city: CanadianCity) => {
    if (props.mode === "single") {
      setQuery(city.name);
      props.onChange(city.name, city.province);
    } else {
      if (!props.value.includes(city.name)) {
        props.onChange([...props.value, city.name]);
      }
      setQuery("");
    }
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" && query.trim().length > 0) {
        search(query);
        return;
      }
      // In multi mode, allow Enter to add free-text city
      if (e.key === "Enter" && props.mode === "multi") {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed && !props.value.includes(trimmed)) {
          props.onChange([...props.value, trimmed]);
          setQuery("");
        }
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          selectCity(results[highlightIndex]);
        } else if (results.length > 0) {
          selectCity(results[0]);
        } else if (props.mode === "multi") {
          const trimmed = query.trim();
          if (trimmed && !props.value.includes(trimmed)) {
            props.onChange([...props.value, trimmed]);
            setQuery("");
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeCity = (city: string) => {
    if (props.mode === "multi") {
      props.onChange(props.value.filter((c) => c !== city));
    }
  };

  return (
    <div className={cn("w-full", props.className)}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {props.label}
        </label>
      )}

      {/* Multi-mode badges */}
      {props.mode === "multi" && props.value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {props.value.map((city) => (
            <span
              key={city}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {city}
              <button
                type="button"
                onClick={() => removeCity(city)}
                className="ml-1.5 hover:text-red-600 font-bold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length > 0) search(query);
          }}
          placeholder={
            props.placeholder ||
            (props.mode === "multi"
              ? "Type a city name..."
              : "Start typing a city...")
          }
          required={props.mode === "single" ? props.required : false}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          autoComplete="off"
        />

        {isOpen && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {results.map((city, idx) => (
              <button
                key={`${city.slug}-${city.province}`}
                type="button"
                onClick={() => selectCity(city)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors",
                  idx === highlightIndex && "bg-green-50 text-green-800",
                  idx === 0 && "rounded-t-lg",
                  idx === results.length - 1 && "rounded-b-lg"
                )}
              >
                <span className="font-medium">{city.name}</span>
                <span className="text-gray-400 ml-1">{city.province}</span>
              </button>
            ))}
          </div>
        )}

        {isOpen && results.length === 0 && query.trim().length >= 2 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          >
            <p className="text-sm text-gray-500">
              No matching city found.{" "}
              {props.mode === "multi" && (
                <span>Press Enter to add &ldquo;{query.trim()}&rdquo; manually.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
