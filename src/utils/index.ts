import fs from "fs";
import { parse } from "csv-parse";
import path from "path";

export const ROOT_DIR = process.cwd();

export const OUT_DIR = "out";

export const chunkArray = <T>(arr: Array<T>, size: number): Array<Array<T>> =>
  arr.length > size
    ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)]
    : [arr];

const rowToObject = (row: string[]) => {
  return {
    id: row?.[0] ?? "",
    name: row?.[1] ?? "",
    selfUrl: row?.[2] ?? "",
    datePosted: row?.[3] ?? "",
    postUrl: row?.[4] ?? "",
  } as Data;
};

export const readFromCsvAsync = (path: string) => {
  return new Promise<Data[]>((resolve, reject) => {
    const data: Array<Data> = [];
    fs.createReadStream(path, "utf8")
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row: string[]) {
        data.push(rowToObject(row));
      })
      .on("end", function () {
        resolve(data);
      })
      .on("error", function (error) {
        reject(error.message);
      });
  });
};

export const init = () => {
  if (!fs.existsSync(path.join(ROOT_DIR, OUT_DIR))) {
    fs.mkdirSync(path.join(ROOT_DIR, OUT_DIR));
    console.log("Out directory successfully created!");
  }
};
