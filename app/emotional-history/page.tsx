"use client";

import { useState, useEffect } from "react";
import EmotionLineChart from '@/components/EmotionLineChart';
import SpotifyLoginButton from '@/components/ui/SpotifyLoginButton';

// Color and emoticon mapping for emotions
const emotionColors: Record<string, string> = {
  happy: "yellow",
  sad: "blue",
  angry: "red",
};

const emotionEmojis: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😡",
  neutal: "-_-"
};

// Fetch data using fetch API
const fetchEmotionData = async () => {
  try {
    const response = await fetch('/api/getEmotionData'); // Calls the new API route
    const data = await response.json(); // Parse the JSON response
    console.log("Fetched data from MongoDB:", data);
    return data;
  } catch (error) {
    console.error('Failed to fetch emotion data:', error);
    return [];
  }
};

interface EmotionScores {
  [key: string]: number;
}

const calculateEmotionAverages = (data: any[], days: number) => {
  const emotionSums: EmotionScores = {};
  const emotionCounts: EmotionScores = {};
  const now = new Date();
  
  if (!Array.isArray(data)) {
    console.error('Data is not an array:', data);
    return {};
  }

  data.forEach(entry => {
    const entryDate = new Date(entry.receivedAt);
    const diffDays = Math.ceil((now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= days) {
      if (entry.chatHistory) {
        entry.chatHistory.forEach((item: any) => {
          if (item.type === 'user_message' && item.models && item.models.prosody && item.models.prosody.scores) {
            const scores = item.models.prosody.scores;
            Object.keys(scores).forEach(emotion => {
              if (!emotionSums.hasOwnProperty(emotion)) {
                emotionSums[emotion] = 0;
                emotionCounts[emotion] = 0;
              }
              emotionSums[emotion] += scores[emotion];
              emotionCounts[emotion]++;
            });
          }
        });
      }
    }
  });

  const emotionAverages: EmotionScores = {};
  Object.keys(emotionSums).forEach(emotion => {
    if (emotionCounts[emotion] > 0) {
      emotionAverages[emotion] = emotionSums[emotion] / emotionCounts[emotion];
    }
  });

  return emotionAverages;
};

const getDominantEmotion = (emotionAverages: EmotionScores) => {
  return Object.keys(emotionAverages).reduce((a, b) => (emotionAverages[a] > emotionAverages[b] ? a : b), "happy");
};

export default function EmotionalHistory() {
  const [emotionAvgs, setEmotionAvgs] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly'); // State to track view mode
  const [loggedIn, setLoggedIn] = useState(false); // State to track if user is logged in
  const [recommendedMusic, setRecommendedMusic] = useState<any[]>([]); // State for recommended music

  useEffect(() => {
    fetchEmotionData().then(async data => {
      if (Array.isArray(data)) {
        const days = viewMode === 'weekly' ? 7 : 30;
        const calculatedAverages = calculateEmotionAverages(data, days);
        setEmotionAvgs(calculatedAverages);
      } else {
        console.error('Data fetched is not an array:', data);
      }
    });
  }, [viewMode]); // Recalculate emotion data when viewMode changes

  if (!emotionAvgs) {
    return <p>Loading emotional data...</p>;
  }

  const now = new Date();
  const daysToShow = viewMode === 'weekly' ? 7 : 30;
  
  const emotionDataArray = Array.from({ length: daysToShow }).map((_, index) => {
    const timestamp = new Date(now.getTime() - index * 86400000).toISOString(); // Each day in the range
    const emotionAverages = calculateEmotionAverages(emotionAvgs, daysToShow); // Calculate averages for the time frame
    const dominantEmotion = getDominantEmotion(emotionAverages); // Get the dominant emotion for each day

    return {
      emotion: dominantEmotion,
      intensity: emotionAverages[dominantEmotion] || 0.0, // Default intensity to 0.0 if undefined
      emoji: emotionEmojis[dominantEmotion],
      timestamp,
    };
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Your Emotional History</h1>

      {/* Spotify Login Button */}
      <div className="mb-4">
        {!loggedIn ? (
          <SpotifyLoginButton />
        ) : (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">Music Recommendations Based on Your Mood</h2>
            <ul>
              {recommendedMusic.map((track, index) => (
                <li key={index}>
                  <p>{track.name} by {track.artists[0].name}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-6 space-x-4"> {/* Added space between buttons */}
        <button
          className={`px-4 py-2 rounded ${viewMode === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setViewMode('weekly')}
        >
          Weekly View
        </button>
        <button
          className={`px-4 py-2 rounded ${viewMode === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setViewMode('monthly')}
        >
          Monthly View
        </button>
      </div>

      {/* Emotion Overview Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">Emotion Overview ({viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {emotionDataArray.map((entry, index) => (
            <div key={index} className="p-4 bg-gray-100 rounded-lg shadow">
              <p className="text-lg">{entry.timestamp.split("T")[0]}</p>
              <span className="text-5xl" style={{ color: emotionColors[entry.emotion] }}>{entry.emoji}</span>
              <p className="text-lg font-bold">{entry.emotion}</p>
              <p>Intensity: {entry.intensity.toFixed(2)}</p> {/* Intensity is now defaulted to 0.00 */}
            </div>
          ))}
        </div>
      </div>

      {/* Line Chart for Emotion Trends */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-6 text-center">Emotional Intensity Over Time (Line Chart)</h2>
        <div className="h-96">
          <EmotionLineChart data={emotionDataArray} />
        </div>
      </div>
    </div>
  );
}
