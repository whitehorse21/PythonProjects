import XLSX from "sheetjs-style";

const exportExcel = (excelData, fileName) => {
  const myHeader = [
    "id",
    "carton_nbr",
    "load_nbr",
    "whse_code",
    "whse_name",
    "load_carton_event_description",
    "old_stat_code",
    "new_stat_code",
    "creation_date",
    "modification_date",
  ];

  const updateData = excelData.map((eachItem) => {
    let newItem = {};
    myHeader.forEach((eachHeader) => {
      newItem[eachHeader] = eachItem[eachHeader];
    });

    return newItem;
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(updateData, {
    header: myHeader,
  });

  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  range.e["c"] = myHeader.length - 1;
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  XLSX.utils.book_append_sheet(workbook, worksheet, "tab1");
  XLSX.writeFile(workbook, "excel_export.xlsx");
};

export { exportExcel };
