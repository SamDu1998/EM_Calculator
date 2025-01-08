# EM Calculator

This project is an Electron-based application that provides a tabbed interface for calculating relative bandwidth and aperture efficiency. The application supports multiple languages (English and Chinese).

## Features

- Tabbed interface with three tabs: Relative Bandwidth, Aperture Efficiency, and TBD.
- Calculate relative bandwidth based on minimum and maximum frequency inputs.
- Calculate aperture efficiency based on frequency, antenna gain, and antenna area inputs.
- Language switcher to toggle between English and Chinese.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/SamDu1998/electron-tabbed-interface.git
    cd electron-tabbed-interface
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Ensure you have Python installed on your system.

## Usage

1. Start the application:
    ```sh
    npm start
    ```

2. Use the tabbed interface to navigate between different functionalities:
    - **Relative Bandwidth**: Enter minimum and maximum frequency values to calculate relative and absolute bandwidth.
    - **Aperture Efficiency**: Enter frequency, antenna gain, and antenna area values to calculate aperture efficiency.
    - **TBD**: Placeholder for future features.

3. Switch languages using the "Language" menu in the application.

## Project Structure

- `main.js`: Main process script that creates the application window and handles IPC communication.
- `preload.js`: Preload script that exposes APIs to the renderer process.
- `renderer.js`: Renderer process script that handles UI interactions and calculations.
- `index.html`: HTML file defining the structure of the tabbed interface.
- `calculate_bandwidth.py`: Python script for calculating bandwidth (to be implemented).

## License

This project is licensed under the MIT License.