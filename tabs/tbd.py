import ttkbootstrap as ttk

def create_tbd_tab(notebook, modern_font):
    tab2 = ttk.Frame(notebook)
    notebook.add(tab2, text="TBD")

    plans = [
        "1. Far-Field Calculator.",
        "2. Formular in each function.",
        "3. more"
    ]

    for plan in plans:
        tbd_label = ttk.Label(tab2, text=plan, font=modern_font)
        tbd_label.pack(pady=5)