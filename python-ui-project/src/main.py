import tkinter as tk
from ttkbootstrap import Style
from ui.app import App

if __name__ == "__main__":
    root = tk.Tk()
    style = Style(theme="cosmo")  # You can choose other themes like "flatly", "minty", etc.
    root.title("Relative Bandwidth Calculator")

    # Set the application icon
    icon = tk.PhotoImage(file="icon.png")
    root.iconphoto(False, icon)

    app = App(root)
    root.mainloop()