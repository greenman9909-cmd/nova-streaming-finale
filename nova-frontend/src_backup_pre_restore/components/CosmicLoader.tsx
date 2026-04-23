export default function CosmicLoader() {
    return (
        <div className="flex justify-center items-center h-full w-full min-h-[300px]">
            <div className="cosmic-loader">
                <div className="orbit"></div>
                <div className="orbit"></div>
                <div className="orbit"></div>
                <div className="center-star"></div>
            </div>
            <style>{`
        .cosmic-loader {
          position: relative;
          width: 100px;
          height: 100px;
        }

        .center-star {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 20px #fff, 0 0 40px #ff00de;
          transform: translate(-50%, -50%);
          animation: pulse 2s ease-in-out infinite;
        }

        .orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transform: translate(-50%, -50%);
        }

        .orbit:nth-child(1) {
          width: 100%;
          height: 100%;
          border-color: #8b5cf6;
          border-top-color: transparent;
          animation: spin 3s linear infinite;
        }

        .orbit:nth-child(2) {
          width: 70%;
          height: 70%;
          border-color: #ec4899;
          border-bottom-color: transparent;
          animation: spin 4s linear infinite reverse;
        }

        .orbit:nth-child(3) {
          width: 40%;
          height: 40%;
          border-color: #06b6d4;
          border-left-color: transparent;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
}
