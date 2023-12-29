import { useState } from "react";
import { UseQueryResult } from "react-query";
import { Upload, UploadColumn, UploadRow } from "./types";

export default function useGetUploadMock(tusId: string) {
  const [configOverrides, setConfigOverrides] = useState({});

  const mockUpload: Upload = {
    id: "133c6fdd-c943-4d70-8826-e98145dc605a",
    tus_id: "5f995a72a08b072d496dc3124de2fb35",
    //importer_id: "e3702fa2-e075-4e88-b0f3-a3c4e77f1e97",
    file_name: "valid.csv",
    file_type: "text/csv",
    file_extension: "csv",
    metadata: {},
    is_stored: true,
    created_at: 1703865082,
    upload_rows: [
      {
        index: 0,
        values: {
          "0": "First",
          "1": "Last",
          "2": "Age",
          "3": "Joined On",
          "4": "Dept",
          "5": "Email"
        }
      },
      {
        index: 1,
        values: {
          "0": "Laura",
          "1": "",
          "2": "22",
          "3": "01/22/2020",
          "4": "Sales",
          "5": "laura@example.com"
        }
      },
      {
        index: 2,
        values: {
          "0": "Craig",
          "1": "Johnson",
          "2": "23",
          "3": "02/25/2020",
          "4": "Depot",
          "5": "craig@example.com"
        }
      },
      {
        index: 3,
        values: {
          "0": "Mary",
          "1": "Jenkins",
          "2": "",
          "3": "02/22/2020",
          "4": "",
          "5": "mary@example.com"
        }
      },
      {
        index: 4,
        values: {
          "0": "Jamie",
          "1": "  ",
          "2": "24",
          "3": "12/23/2019",
          "4": "Engineering",
          "5": "jamie@example.com"
        }
      },
      {
        index: 5,
        values: {
          "0": "Paul",
          "1": "Snicko",
          "2": "27",
          "3": "09/13/2018",
          "4": "Engineering",
          "5": "paul@example.com"
        }
      }
    ],
    upload_columns: [],
    header_row_index: 0,
    template_id: ""
  };

  const query = {
    data: tusId ? mockUpload : undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
    isIdle: false,
    isFetching: false,
    status: 'success',
  };

  return query;
}
