# NetStability AI - Network Stability Analysis Framework

A high-tech, AI-driven network stability analysis tool built with React, TypeScript, D3.js, and Chart.js. This framework uses spectral analysis, Bayesian reasoning, and Graph Neural Networks (GNN) to predict and prevent network failures.

## Features

- **Network Graph Visualization**: Interactive D3.js-based graph with real-time node/edge management.
- **Spectral Analysis**: Real-time eigenvalue computation and spectral radius tracking.
- **Bayesian Reasoning**: Probabilistic failure modeling based on network topology.
- **GNN Predictions**: AI-driven vulnerability assessment using a simulated 2-layer Graph Neural Network.
- **Auto-Defense System**: Automated emergency optimization when stability thresholds are breached.
- **Snapshots**: Save and restore network states for comparative analysis.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-github-repo-url>
cd react-example
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## Project Structure

- `src/components/`: Reusable UI components (NetworkGraph, etc.)
- `src/services/`: Core logic for spectral analysis, Bayesian updates, and GNN simulations.
- `src/App.tsx`: Main application entry point and state management.
- `src/index.css`: Global styles and Tailwind CSS configuration.

## Built With

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [D3.js](https://d3js.org/)
- [Chart.js](https://www.chartjs.org/)
- [Lucide React](https://lucide.dev/)
- [Motion](https://motion.dev/)

## License

This project is licensed under the MIT License.
