import { useState } from "react";
export const mockDataObject = {
  id: "133c6fdd-c943-4d70-8826-e98145dc605a",
  tus_id: "5f995a72a08b072d496dc3124de2fb35",
  importer_id: "e3702fa2-e075-4e88-b0f3-a3c4e77f1e97",
  file_name: "valid.csv",
  file_type: "text/csv",
  file_extension: "csv",
  file_size: 284,
  metadata: {},
  template: null,
  is_stored: true,
  header_row_index: 0,
  matched_header_row_index: null,
  sheet_list: null,
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
        "5": "Email",
      },
    },
    {
      index: 1,
      values: {
        "0": "Laura",
        "1": "",
        "2": "22",
        "3": "01/22/2020",
        "4": "Sales",
        "5": "laura@example.com",
      },
    },
    {
      index: 2,
      values: {
        "0": "Craig",
        "1": "Johnson",
        "2": "23",
        "3": "02/25/2020",
        "4": "Depot",
        "5": "craig@example.com",
      },
    },
    {
      index: 3,
      values: {
        "0": "Mary",
        "1": "Jenkins",
        "2": "",
        "3": "02/22/2020",
        "4": "",
        "5": "mary@example.com",
      },
    },
    {
      index: 4,
      values: {
        "0": "Jamie",
        "1": "  ",
        "2": "24",
        "3": "12/23/2019",
        "4": "Engineering",
        "5": "jamie@example.com",
      },
    },
    {
      index: 5,
      values: {
        "0": "Paul",
        "1": "Snicko",
        "2": "27",
        "3": "09/13/2018",
        "4": "Engineering",
        "5": "paul@example.com",
      },
    },
  ],
  upload_columns: [
    {
      id: "2bb69b1c-501e-485d-a751-4560996d111c",
      name: "First",
      index: 0,
      sample_data: ["Laura", "Craig", "Mary"],
      suggested_template_column_id: "68adf687-3eea-4d7a-9ef5-455c6795f6f0",
    },
    {
      id: "d76efd32-d0ce-4aab-990f-0f2cd06ffdef",
      name: "Last",
      index: 1,
      sample_data: ["", "Johnson", "Jenkins"],
      suggested_template_column_id: "5378e6f3-4205-484f-bf3f-baa28410bbbf",
    },
    {
      id: "4c1f6e51-5013-4f70-8a84-ecf63845b7a6",
      name: "Age",
      index: 2,
      sample_data: ["22", "23", ""],
      suggested_template_column_id: null,
    },
    {
      id: "99aa1436-18bf-4b0b-a18b-0184eddf844b",
      name: "Joined On",
      index: 3,
      sample_data: ["01/22/2020", "02/25/2020", "02/22/2020"],
      suggested_template_column_id: null,
    },
    {
      id: "a391771a-1338-4d64-a84f-972aee1c8df7",
      name: "Dept",
      index: 4,
      sample_data: ["Sales", "Depot", ""],
      suggested_template_column_id: null,
    },
    {
      id: "759fd34a-ef93-4b9d-9db9-f8f8ac23b602",
      name: "Email",
      index: 5,
      sample_data: [
        "laura@example.com",
        "craig@example.com",
        "mary@example.com",
      ],
      suggested_template_column_id: "04b954ad-6aa1-4426-b617-6ce9556c588d",
    },
  ],
};

async function mockMutateHeader(uploadId: string, rowIndex: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        error: "",
        data: mockDataObject,
        status: 200,
      });
    }, 1000);
  });
}

export default function useMockPostSetHeader(uploadId: string) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = async ({ selectedHeaderRow }: any) => {
    setIsLoading(true);
    try {
      const response = (await mockMutateHeader(
        uploadId,
        selectedHeaderRow
      )) as any;
      setData(response.data);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, error, isSuccess: true, isLoading, mutate };
}
