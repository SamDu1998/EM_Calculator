import tkinter as tk
from ttkbootstrap import Style
from ttkbootstrap.widgets import Label, Entry, Button
from tkinter import font

class App:
    def __init__(self, master):
        self.master = master
        style = Style(theme="cosmo")  # You can choose other themes like "flatly", "minty", etc.
        master.title("Relative Bandwidth Calculator")

        master.columnconfigure(0, weight=1)
        master.columnconfigure(1, weight=1)
        master.rowconfigure(0, weight=1)
        master.rowconfigure(1, weight=1)
        master.rowconfigure(2, weight=1)
        master.rowconfigure(3, weight=1)

        self.default_font = font.nametofont("TkDefaultFont")
        self.default_font.configure(size=12)

        self.label1 = Label(master, text="Enter smaller number (left frequency):")
        self.label1.grid(row=0, column=0, padx=10, pady=10, sticky="ew")
        self.label1.configure(font=self.default_font)

        self.entry1 = Entry(master, bootstyle="info")
        self.entry1.grid(row=0, column=1, padx=10, pady=10, sticky="ew")
        self.entry1.configure(font=self.default_font)

        self.label2 = Label(master, text="Enter larger number (right frequency):")
        self.label2.grid(row=1, column=0, padx=10, pady=10, sticky="ew")
        self.label2.configure(font=self.default_font)

        self.entry2 = Entry(master, bootstyle="info")
        self.entry2.grid(row=1, column=1, padx=10, pady=10, sticky="ew")
        self.entry2.configure(font=self.default_font)

        self.calculate_button = Button(master, text="Calculate", command=self.calculate, bootstyle="success")
        self.calculate_button.grid(row=2, column=0, columnspan=2, pady=10, sticky="ew", ipadx=10, ipady=5)
        self.calculate_button.configure(font=self.default_font)

        self.result_label = Label(master, text="Result:")
        self.result_label.grid(row=3, column=0, padx=10, pady=10, sticky="ew")
        self.result_label.configure(font=self.default_font)

        self.result = Entry(master, bootstyle="info")
        self.result.grid(row=3, column=1, padx=10, pady=10, sticky="ew")
        self.result.configure(font=self.default_font)

    def calculate(self):
        num1 = float(self.entry1.get())
        num2 = float(self.entry2.get())
        if num1 > num2:
            self.result.delete(0, tk.END)
            self.result.insert(0, "Please enter smaller number in left frequency and larger number in right frequency")
        else:
            result = calculate_relative_bandwidth(num1, num2)
            self.result.delete(0, tk.END)
            self.result.insert(0, f"{result:.2f}%")

def calculate_relative_bandwidth(num1, num2):
    if num2 == 0:
        return "Undefined (division by zero)"
    return (num2 - num1) / ((num1 + num2) / 2) * 100