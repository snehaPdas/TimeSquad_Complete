
const Order=require("../Models/orderSchema")
const PDFDocument=require('pdfkit')
const getSlesReportPage=async(req,res)=>{
    try {
        let filterBy = req.query.day
        if (filterBy) {
            res.redirect(`/admin/${req.query.day}`)
        } else {
            res.redirect(`/admin/salesMonthly`)
        }   
    } catch (error) {
        console.log(error)
    }
}
const salesToday = async (req, res) => {
    try {

        let today = new Date()
        const startOfTheDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),0,0,0,0)

        const endOfTheDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),23,59,59,999)

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfTheDay,
                        $lt: endOfTheDay
                    },
                    orderStatus: "Delivered"
                }
            }
        ]).sort({ createdAt: -1 })
        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
         let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("admin/salesReport", { data: currentOrder, totalPages, currentPage, salesToday: true })

    } catch (error) {
        console.log(error.message);
    }
}

const salesMonthly = async (req, res) => {
    try {
        let currentMonth = new Date().getMonth() + 1
        const startOfTheMonth = new Date(
            new Date().getFullYear(),
            currentMonth - 1,
            1, 0, 0, 0, 0
        )
        const endOfTheMonth = new Date(
            new Date().getFullYear(),
            currentMonth,
            0, 23, 59, 59, 999
        )
        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfTheMonth,
                        $lt: endOfTheMonth
                    },
                    orderStatus: "Delivered"
                }
            }
        ]).sort({ createdAt: -1 })
        const totalmontlyorder=orders.length
        
    
        

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("admin/salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true})
    

    } catch (error) {
        console.log(error.message);
    }
}


const salesWeekly = async (req, res) => {
    try {
        let currentDate = new Date()
        const startOfTheWeek = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() - currentDate.getDay()
        )

        const endOfTheWeek = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            currentDate.getDate() + (6 - currentDate.getDay()),
            23,
            59,
            59,
            999
        )

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfTheWeek,
                        $lt: endOfTheWeek
                    },
                    orderStatus: "Delivered"
                }
            }
        ]).sort({ createdAt: -1 })
        
    
    

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("admin/salesReport", { data: currentOrder, totalPages, currentPage, salesWeekly: true })

    } catch (error) {
        console.log(error.message);
    }
}
const salesYearly = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear()
        const startofYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
        const endofYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)

        const orders = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startofYear,
                        $lt: endofYear
                    },
                    orderStatus: "Delivered"
                }
            }
        ])


        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("admin/salesReport", { data: currentOrder, totalPages, currentPage, salesYearly: true })

    } catch (error) {
        console.log(error.message);
    }
}

const generatePdf = async (req, res) => {
    try {
        const doc = new PDFDocument();
      const filename = 'sales-report.pdf';
      const orders = req.body;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      doc.pipe(res);
      doc.fontSize(12);
      doc.text('Sales Report', { align: 'center', fontSize: 16 });
      const margin = 5;
      doc
        .moveTo(margin, margin) 
        .lineTo(600 - margin, margin) 
        .lineTo(600 - margin, 842 - margin) 
        .lineTo(margin, 842 - margin) 
        .lineTo(margin, margin) 
        .lineTo(600 - margin, margin) 
        .lineWidth(3)
        .strokeColor('#000000')
        .stroke();
      
      doc.moveDown();

      
      const headers = ['Order ID', 'Name', 'Date', 'Total']; 
      
      let headerX = 20;
      const headerY = doc.y + 10;
      
      doc.text(headers[0], headerX, headerY); 
      headerX += 200; 
      
      headers.slice(1).forEach(header => {
        doc.text(header, headerX, headerY);
        headerX += 130; 
      });
      
      let dataY = headerY + 25;
      
      orders.forEach(order => {
        doc.text(order.dataId, 20, dataY); 
        doc.text(order.name, 210, dataY);
        doc.text(order.date, 350, dataY);
        doc.text(order.totalAmount, 480, dataY);
        dataY += 30; 

      });
      
      doc.end();
    } catch (error) {
        console.log(error.message);
    }
}

module.exports={
    getSlesReportPage,
    salesToday,
    salesMonthly,
    salesWeekly,
    salesYearly,
    generatePdf


}