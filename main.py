import tkinter as tk
import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from tabs.relative_bandwidth import create_relative_bandwidth_tab
from tabs.tbd import create_tbd_tab
from tabs.aperture_efficiency import create_aperture_efficiency_tab

def main():
    root = ttk.Window(themename="cosmo")
    root.title("EM Calculator")
    root.geometry("400x350")
    root.minsize(400, 350)

    notebook = ttk.Notebook(root, bootstyle="primary")
    notebook.pack(fill='both', expand=True)

    modern_font = ("Helvetica", 12)

    create_relative_bandwidth_tab(notebook, modern_font)
    create_aperture_efficiency_tab(notebook, modern_font)
    create_tbd_tab(notebook, modern_font)

    author_label = ttk.Label(root, text="Author: Sam; Version: 20250107", font=("Helvetica", 10))
    author_label.pack(side=tk.BOTTOM, pady=5)

    root.mainloop()

if __name__ == "__main__":
    main()