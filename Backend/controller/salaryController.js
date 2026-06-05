const SalaryStructure = require("../model/SalaryStructure");
const User = require("../model/User");

// ==========================================
// CREATE SALARY STRUCTURE
// ==========================================
exports.createSalaryStructure =
  async (req, res) => {
    try {

      const {
        employeeId,
        basicSalary,
        hra,
        specialAllowance,
        bonus,
        pf,
        professionalTax,
        otherDeductions,
      } = req.body;

      if (
        !employeeId ||
        !basicSalary
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Employee ID and Basic Salary are required",
        });
      }

      const employee =
        await User.findById(
          employeeId
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Employee not found",
        });
      }

      const existingSalary =
        await SalaryStructure.findOne({
          employee: employeeId,
        });

      if (existingSalary) {
        return res.status(400).json({
          success: false,
          message:
            "Salary structure already exists",
        });
      }

      const grossSalary =
        Number(basicSalary) +
        Number(hra || 0) +
        Number(
          specialAllowance || 0
        ) +
        Number(bonus || 0);

      const netSalary =
        grossSalary -
        Number(pf || 0) -
        Number(
          professionalTax || 0
        ) -
        Number(
          otherDeductions || 0
        );

      const salary =
        await SalaryStructure.create({
          employee: employeeId,

          basicSalary,

          hra,

          specialAllowance,

          bonus,

          pf,

          professionalTax,

          otherDeductions,

          grossSalary,

          netSalary,

          createdBy:
            req.user.id,
        });

      return res.status(201).json({
        success: true,
        message:
          "Salary structure created successfully",
        data: salary,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// UPDATE SALARY STRUCTURE
// ==========================================
exports.updateSalaryStructure =
  async (req, res) => {
    try {

      const { employeeId } =
        req.params;

      const {
        basicSalary,
        hra,
        specialAllowance,
        bonus,
        pf,
        professionalTax,
        otherDeductions,
      } = req.body;

      const salary =
        await SalaryStructure.findOne({
          employee: employeeId,
        });

      if (!salary) {
        return res.status(404).json({
          success: false,
          message:
            "Salary structure not found",
        });
      }

      salary.basicSalary =
        basicSalary ??
        salary.basicSalary;

      salary.hra =
        hra ?? salary.hra;

      salary.specialAllowance =
        specialAllowance ??
        salary.specialAllowance;

      salary.bonus =
        bonus ?? salary.bonus;

      salary.pf =
        pf ?? salary.pf;

      salary.professionalTax =
        professionalTax ??
        salary.professionalTax;

      salary.otherDeductions =
        otherDeductions ??
        salary.otherDeductions;

      salary.grossSalary =
        Number(
          salary.basicSalary
        ) +
        Number(salary.hra) +
        Number(
          salary.specialAllowance
        ) +
        Number(salary.bonus);

      salary.netSalary =
        salary.grossSalary -
        Number(salary.pf) -
        Number(
          salary.professionalTax
        ) -
        Number(
          salary.otherDeductions
        );

      await salary.save();

      return res.status(200).json({
        success: true,
        message:
          "Salary structure updated successfully",
        data: salary,
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// GET EMPLOYEE SALARY
// ADMIN
// ==========================================
exports.getSalaryStructure =
  async (req, res) => {
    try {

      const { employeeId } =
        req.params;

      const salary =
        await SalaryStructure
          .findOne({
            employee:
              employeeId,
          })
          .populate(
            "employee",
            "firstName lastName email employeeId department designation"
          );

      if (!salary) {
        return res.status(404).json({
          success: false,
          message:
            "Salary structure not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: salary,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

// ==========================================
// GET MY SALARY
// EMPLOYEE
// ==========================================
exports.getMySalary =
  async (req, res) => {
    try {

      const employeeId =
        req.user.id;

      const salary =
        await SalaryStructure
          .findOne({
            employee:
              employeeId,
          })
          .populate(
            "employee",
            "firstName lastName email employeeId department designation"
          );

      if (!salary) {
        return res.status(404).json({
          success: false,
          message:
            "Salary structure not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: salary,
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };