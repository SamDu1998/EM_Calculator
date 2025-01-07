# EM Calculator

EM Calculator is a graphical user interface (GUI) application for calculating various electromagnetic parameters such as relative bandwidth and aperture efficiency. The application is built using Python and the `ttkbootstrap` library for a modern look and feel.

## Features

- Calculate relative bandwidth
- Calculate aperture efficiency
- User-friendly interface with `ttkbootstrap` themes

## Installation and Rebuilding

### Prerequisites

- Python 3.x
- `ttkbootstrap` library

You can install the required library using pip:

```sh
pip install ttkbootstrap
```

### Running the Application

To run the application, execute the following command:

```sh
python main.py
```

### Download Executable

You can download the executable file from the [GitHub Releases](https://github.com/SamDu1998/EMCalculator/releases) page. This allows you to run the application without needing to install Python or any dependencies.

## Building the Executable

If you want to build the executable yourself, you can use `pyinstaller`. Run the following command:

```sh
pyinstaller --name EMCalculator --onefile --windowed --icon=icon.png --noconsole main.py
```

## Usage

1. Launch the application.
2. Navigate through the tabs to access different calculators.
3. Enter the required values and select the appropriate units.
4. Click the "Calculate" button to see the results.

## Author

- Sam

## License

This project is licensed under the MIT License.
