✨ Cutlist Maker ✨

Stop wasting material and time on your cutting projects!


Tired of material scraps piling up? Cutlist Maker is your free, smart web application designed to revolutionize how you cut sheet materials like wood, metal, glass, or fabric. It intelligently calculates the most efficient cutting layouts based on your available stock and required parts, minimizing waste and maximizing your savings.

Try the free demo now at: cut.cloudhost.pt

Stop wasting material and time! Cutlist Maker is a smart web application designed to help you find the most efficient way to cut sheet materials like wood, metal, glass, or fabric for your projects. It calculates the optimal layout based on your available stock and required parts, minimizing waste and potentially saving you money.
(Consider adding a screenshot or GIF of the app in action here!)

🚀 Key Features
🧠 Smart Optimization: Calculates efficient cutting layouts to maximize material usage.
🪵 Flexible Stock Input: Define your available stock panels, including dimensions (length, width), quantity, and optional price per panel. Add or remove stock types easily.
🧩 Detailed Required Parts: List all the parts you need, specifying dimensions (length, width), quantity, and an optional label for easy identification on the layout.
⚙️ Customizable Settings: Fine-tune the calculation with essential parameters:
Units: Work in millimeters, centimeters, or inches.
Blade Kerf: Account for the material lost during cutting.
Grain Direction: Ensure parts are oriented correctly on the stock material (optional).
Edge Banding: Factor in edge banding thickness (optional).
Edge Trimming: Allow for trimming allowances on required parts (optional).
Price Calculation: Estimate project costs based on stock panel prices (optional).
Rotation Control: Decide whether parts can be rotated (e.g., 90 degrees) on the stock panel during optimization.


📊 Visual Layout
----------------
See a clear, graphical representation of how your required parts are laid out on the stock panels. Cut pieces are color-coded and labeled with dimensions and your custom labels.

📈 Summary Statistics
---------------------
Get a quick overview of the results:
Total Stock Area Used
Total Required Part Area
Overall Material Yield (%)
Number of Stock Panels Needed
Total Cut Length
Estimated Cost (if enabled)


📄 Export & Print
-----------------
Easily print the visual layout and summary or download it for offline use (functionality planned/in development).


🤔 How It Works
---------------
Configure: Set your units, blade kerf, and other preferences in the Settings section.
Input: Enter the details of your available Stock Panels and the Required Panels you need to cut.
Calculate: Hit the "Calculate Layout" button.
Review: Analyze the generated visual layout and summary statistics to understand the optimal cutting strategy.


💻 Technology
-------------
Built with React for a modern, interactive user experience.


🚀 Key Features (Continued)
---------------------------
Real-time Calculation: See the optimized layout and summary statistics update instantly as you input or modify your stock and part information. No need to wait for manual recalculations.
Drag & Drop Interface (Planned/In Development): Envision a future where you can visually rearrange parts on the stock panels for even greater control or to explore alternative layouts.
Nesting Capabilities (Advanced Feature): For more complex projects, explore the possibility of nesting smaller parts within larger cutouts to further minimize waste (functionality planned/in development).
Material Database (Optional): Save frequently used stock panel dimensions and prices in a personal database for quicker input in future projects.
Report Generation: Generate detailed reports including the cut list, material usage, and cost breakdown for your records or to share with others. 


⚙️ Customizable Settings (More Detail)
--------------------------------------
Units: Choose your preferred unit of measurement (millimeters, centimeters, or inches) for all dimensions. The application will handle conversions internally.
Blade Kerf: Accurately account for the width of the saw blade to ensure precise cuts and prevent material shortages. Specify the kerf thickness in your chosen units.
Grain Direction: If the material has a specific grain direction (like wood), you can align parts accordingly on the stock panel to maintain visual consistency in your project.
Edge Banding: If you plan to apply edge banding to your parts, specify the thickness of the banding. The application will adjust the part dimensions in the layout to accommodate this.
Edge Trimming: Allow for a small amount of extra material around your required parts for trimming imperfections or achieving a perfect final size. Define the trimming allowance per edge.
Price Calculation: Assign prices to your stock panels to get an estimated cost for your project based on the material used. This can help you compare material options and manage your budget.
Rotation Control: Decide whether parts can be rotated (e.g., 90 degrees) on the stock panel during optimization to find the most efficient layout. 


📊 Visual Layout (More Detail) 
------------------------------
The visual layout provides an intuitive representation of your cutting plan.
Color-Coded Parts: Each unique required part is assigned a distinct color, making it easy to differentiate them on the stock panels.
Dimension Labels: Clear labels display the length and width of each cut piece directly on the layout.
Custom Labels: If you've assigned custom labels to your required parts (e.g., "Shelf A", "Door Panel"), these labels are displayed on the corresponding pieces in the layout for easy identification during cutting.
Stock Panel Boundaries: The outlines of your defined stock panels are clearly visible, showing how the parts are arranged within each panel.
Waste Areas: Areas of unused material on the stock panels are clearly indicated, allowing you to visualize the efficiency of the layout.
Zoom and Pan: Easily zoom in for detailed inspection or pan across larger layouts. 


📈 Summary Statistics (Explanation of Significance)
---------------------------------------------------
Total Stock Area Used: This metric shows the total surface area of all the stock panels that will be used for your project.
Total Required Part Area: This indicates the combined surface area of all the parts you need to cut.
Overall Material Yield (%)**: This crucial percentage represents the efficiency of the cutting layout, calculated as (Total Required Part Area / Total Stock Area Used) * 100. A higher yield means less material waste.
Number of Stock Panels Needed: This tells you the exact number of each type of stock panel required to cut all your parts.
Total Cut Length: This indicates the total length of all the cuts needed to obtain your required parts. This can be useful for estimating cutting time or wear on your tools.
Estimated Cost (if enabled): If you've entered prices for your stock panels, this will display the estimated cost of the material used for your project. 📄 Export & Print (Elaboration)
Print-Friendly Layout: The visual layout will be optimized for printing on standard paper sizes, ensuring clarity and readability in your workshop.
PDF Export: Download the visual layout and summary statistics as a PDF document for easy sharing and offline access.
Cut List Export (Planned): Export a detailed text-based cut list containing the dimensions and labels of each required part, along with the stock panel it will be cut from. This can be very useful for following during the cutting process.
CSV Export (Planned): Export all the data (stock, parts, summary) in a CSV format for further analysis or integration with other tools. 

🤔 How It Works (More Specific Steps)
-------------------------------------
Configure: Start by selecting your preferred Units (e.g., inches). Then, enter the Blade Kerf of your saw blade. Optionally, adjust other settings like Grain Direction, Edge Banding, and Edge Trimming if applicable to your project.
Input Stock Panels: Click the "Add Stock" button to enter the dimensions (Length, Width), Quantity, and optional Price per Panel for each type of stock material you have available. You can easily add or remove stock types as needed.
Input Required Parts: Click the "Add Part" button to specify the dimensions (Length, Width), Quantity, and an optional Label for each part you need to cut. Be as precise as possible with your measurements.
Calculate: Once you've entered all your stock and part information, click the "Calculate Layout" button. The application will then process your data and generate the optimized cutting layout.
Review: Examine the generated Visual Layout to see how your parts are arranged on the stock panels. Review the Summary Statistics to understand the material yield, number of panels needed, and other important information.
Export/Print: (Once available) Use the "Export" or "Print" options to save or print the layout and summary for use in your workshop. 


💻 Technology (More Detail)
---------------------------
Frontend: Built with React, a JavaScript library for building user interfaces, ensuring a responsive and interactive experience.
Backend (Conceptual): The optimization algorithms could be implemented using Python or JavaScript, leveraging libraries specifically designed for nesting and cutting stock problems. Data storage (for optional features like the material database) could utilize technologies like local storage or a cloud-based database. ✨ Benefits of Using Cutlist Maker ✨
Minimize Material Waste: Achieve the highest possible material yield, saving you money on raw materials.
Save Time: Quickly generate optimized cutting plans, eliminating the need for manual calculations and guesswork.
Reduce Errors: Ensure accurate cuts by following the clear visual layout and detailed cut list.
Improve Organization: Keep your projects organized with clear documentation of your cutting strategy.
Cost-Effective: Optimize your material usage to stay within your project budget.
Versatile: Applicable to a wide range of sheet materials, including wood, metal, glass, and fabric. 


🚀 Getting Started
------------------
Visit the Cutlist Maker website at cut.cloudhost.pt.
Familiarize yourself with the user interface and the different sections.
Start by configuring your project settings (units, blade kerf, etc.).
Input your available stock panels and the required parts you need to cut.
Click "Calculate Layout" and explore the optimized results. 


💡 Use Cases
------------
Woodworking: Building furniture, cabinets, shelves, and other wooden projects.
Metalworking: Cutting sheet metal for fabrication, automotive repairs, or DIY projects.
Glass Cutting: Optimizing glass sheets for windows, mirrors, or custom glasswork.
Fabric Cutting: Laying out patterns on fabric for sewing and upholstery projects.
DIY and Home Improvement: Any project that involves cutting sheet materials to specific dimensions. 


🛣️ Future Enhancements
----------------------
Advanced Nesting Algorithms: Implement more sophisticated algorithms to handle complex shapes and further improve material yield.
Interactive Drag & Drop Layout Editor: Allow users to manually adjust the layout for fine-tuning or specific requirements.
Shape Support: Enable the input and optimization of non-rectangular parts. * Integration with Other Tools: Explore possibilities for integration with CAD software or inventory management systems.   
Cloud Saving and Collaboration: Allow users to save their projects in the cloud and collaborate with others. 


🤝 Contributing 
---------------
We welcome contributions from the community! If you have ideas for new features, bug fixes, or improvements, please feel free to contribute to the project repository (link to be added). 


📄 License 
----------
Cutlist Maker is licensed under the MIT License.   
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.   


📞 Support
----------
Cutlist Maker is a free application provided as is. There is no official support offered at this time. However, community contributions and feedback are welcome.
