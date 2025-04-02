import React from 'react'
import ReactSpeedometer from "react-d3-speedometer"

function DashboardHealthScore({ score = 45 }) {
  return (
    <div className="text-center">
      <h2>Your Health Score</h2>
      <div className="flex justify-center">
        <ReactSpeedometer
          width={300}
          height={200}
          value={score}
          minValue={0}
          maxValue={100}
          segments={5}
          currentValueText={`${score}/100`}
          customSegmentLabels={[
            {
              text: "Poor",
              position: "INSIDE",
              color: "#555",
            },
            {
              text: "Fair",
              position: "INSIDE",
              color: "#555",
            },
            {
              text: "Good",
              position: "INSIDE",
              color: "#555",
            },
            {
              text: "Great",
              position: "INSIDE",
              color: "#555",
            },
            {
              text: "Excellent",
              position: "INSIDE",
              color: "#555",
            },
          ]}
          segmentColors={["#FF4B4B", "#FFA500", "#FFDD00", "#90EE90", "#00FF00"]}
          needleColor="#333"
          textColor="#333"
        />
      </div>
      <p className="mt-2 text-gray-600">Based on your recent activity and diet.</p>
    </div>
  )
}

export default DashboardHealthScore 