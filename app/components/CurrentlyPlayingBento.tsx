"use client";

import React from "react";
import Link from "next/link";
import { BentoCard } from "./BentoCard";
import { motion } from "framer-motion";

export interface CurrentlyPlaying {
  artist: string;
  albumName: string;
  albumId: string;
  artistId: string;
  title: string;
  albumImageUrl: string;
  songUrl: string;
  isPlaying: boolean;
}

const favorite: CurrentlyPlaying = {
  artist: "Bear McCreary",
  albumName: "The Lord of the Rings: The Rings of Power",
  albumId: "2Oe6kYDU9YQhun0YrXL9eV",
  artistId: "2ifvIECHAlEgPMBuBOJ0lG",
  title: "The Sun Yet Shines",
  albumImageUrl:
    "https://i.scdn.co/image/ab67616d0000b2735cf2a1df961de6e7d7d3c113",
  songUrl: "https://open.spotify.com/track/5hcRWT88VLlbhEMh4efCMy",
  isPlaying: false,
};

export function CurrentlyPlayingBento() {
  const currentTrack = favorite;
  const isCurrentlyPlaying = false;

  return (
    <BentoCard height="h-[300px]">
      <div className="flex flex-col">
        <div className="z-10 h-full">
          <div className="flex h-full flex-col justify-between">
            <h2 className="mb-2 text-base font-medium">
              {isCurrentlyPlaying ? "Currently Playing" : "Recent Favorite"}
            </h2>
            <p className="max-h-[150px] overflow-hidden text-base text-text-secondary">
              <span className="line-clamp-4 text-ellipsis">
                I&apos;m listening to{" "}
                <a className="font-semibold text-text-primary" href={currentTrack.songUrl} target="_blank" rel="noopener noreferrer">
                  {currentTrack.title}
                </a>{" "}
                by{" "}
                <a
                  className="font-semibold text-text-primary"
                  href={`https://open.spotify.com/artist/${currentTrack.artistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentTrack.artist}
                </a>{" "}
                from the album{" "}
                <a
                  className="font-semibold text-text-primary"
                  href={`https://open.spotify.com/album/${currentTrack.albumId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentTrack.albumName}
                </a>
              </span>
            </p>
          </div>
          <div className="user-select-none pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 group-hover:-bottom-1">
            <Record
              albumImageUrl={currentTrack.albumImageUrl}
              isPlaying={isCurrentlyPlaying}
            />
          </div>
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2">
            <div
              className="h-[210px] w-[210px] rounded-sm bg-cover bg-center shadow-md"
              style={{ backgroundImage: `url(${currentTrack.albumImageUrl})` }}
            ></div>
          </div>
        </div>
        <span className="absolute -bottom-32 left-1/2 -translate-x-1/2">
          <CirclePattern />
        </span>
      </div>
    </BentoCard>
  );
}

function CirclePattern({ isHovered }: { isHovered?: boolean }) {
  const rings = [
    { width: 195, height: 195, x: 86.5, y: 108.5, delay: 0 },
    { width: 267, height: 267, x: 50.5, y: 72.5, delay: 0.2 },
    { width: 339, height: 339, x: 14.5, y: 36.5, delay: 0.4 },
    { width: 411, height: 411, x: -21.5, y: 0.5, delay: 0.6 },
  ];

  return (
    <svg
      className="h-full w-[400px]"
      viewBox="0 0 368 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {rings.map((ring, index) => (
        <motion.rect
          key={index}
          x={ring.x}
          y={ring.y}
          width={ring.width}
          height={ring.height}
          rx={ring.width / 2}
          fill="none"
          initial={{ stroke: "#D6DADE", strokeOpacity: 0.5 }}
          animate={{
            stroke: isHovered ? "#818cf8" : "#D6DADE",
            strokeOpacity: isHovered ? 1 : 0.5,
          }}
          transition={{
            duration: 0.4,
            delay: isHovered ? ring.delay : 0.45 - ring.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </svg>
  );
}

function Record({
  albumImageUrl,
  isPlaying,
}: {
  albumImageUrl: string;
  isPlaying: boolean;
}) {
  return (
    <svg
      width="179"
      height="171"
      viewBox="0 0 179 171"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="89.5" cy="104.5" r="89.5" fill="#3C3C3F" />
      <circle
        cx="89.501"
        cy="104.5"
        r="87.06"
        stroke="#6C6D70"
        strokeWidth="1.3"
      />
      <circle
        cx="89.4992"
        cy="104.5"
        r="80.3"
        stroke="#4D4E52"
        strokeWidth="0.5"
      />
      <circle
        cx="89.4995"
        cy="104.5"
        r="69.56"
        stroke="#4D4E52"
        strokeWidth="0.5"
      />
      <circle
        cx="89.4995"
        cy="104.5"
        r="65.98"
        stroke="#4D4E52"
        strokeWidth="0.5"
      />
      <circle
        cx="89.4999"
        cy="104.5"
        r="49.87"
        stroke="#4D4E52"
        strokeWidth="0.5"
      />
      <g
        className={isPlaying ? "animate-spin-slow" : ""}
        style={{ transformOrigin: "89.5001px 104.5px" }}
      >
        <circle
          cx="89.5001"
          cy="104.5"
          r="39.13"
          fill="#4D4E52"
          stroke="#4D4E52"
          strokeWidth="0.5"
        />
        <clipPath id="albumClip">
          <circle cx="89.5001" cy="104.5" r="35" />
        </clipPath>
        <image
          href={albumImageUrl}
          x="54.5001"
          y="69.5"
          width="70"
          height="70"
          clipPath="url(#albumClip)"
        />
      </g>
      <circle cx="89.5009" cy="104.5" r="3.58" fill="#4D4E52" />
      <circle
        cx="89.5009"
        cy="104.5"
        r="3.33"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="0.5"
      />
      <g filter="url(#filter0_f_161_134)">
        <path
          d="M88.5 97L46 26C84.8 5.60003 121.833 18.5 135.5 27.5L88.5 97Z"
          fill="white"
          fillOpacity="0.15"
          style={{ mixBlendMode: "soft-light" }}
        />
      </g>
      <path
        d="M60 22.5C69.6667 18.6667 95.1 13.3 119.5 22.5"
        stroke="url(#paint0_linear_161_134)"
      />
      <path
        d="M59 46C73.5 38.5 96 34 118.5 45.5"
        stroke="url(#paint1_linear_161_134)"
        strokeOpacity="0.3"
      />
      <defs>
        <filter
          id="filter0_f_161_134"
          x="31"
          y="0.119873"
          width="119.5"
          height="111.88"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur
            stdDeviation="7.5"
            result="effect1_foregroundBlur_161_134"
          />
        </filter>
        <linearGradient
          id="paint0_linear_161_134"
          x1="60"
          y1="19.9601"
          x2="119.5"
          y2="19.9601"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.51" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_161_134"
          x1="60"
          y1="40.9601"
          x2="119.5"
          y2="40.9601"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.51" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
