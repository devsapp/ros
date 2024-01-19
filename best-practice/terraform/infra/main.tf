variable "BucketName" {
  type        = string
  description = "bucket name."
}

variable "InstanceName" {
  type        = string
  description = "ots instance name."
}

# variable "TableName" {
#   type        = string
#   description = "ots table name."
# }


resource "alicloud_oss_bucket" "Bucket_001" {
  bucket = var.BucketName
  acl    = "private"
}

resource "alicloud_ots_instance" "Instance_001" {
  name = var.InstanceName
  accessed_by   = "Any"
  instance_type  = "Capacity"
  description   = "test ots instance"
}

# resource "alicloud_ots_table" "Table_001" {
#   instance_name = alicloud_ots_instance.Instance_001.name
#   table_name    = var.TableName

#   primary_key {
#     name = "id"
#     type = "String"
#   }

#   time_to_live = -1
#   max_version = 1
#   deviation_cell_version_in_sec = 86400

#   depends_on = [alicloud_ots_instance.Instance_001]
# }

output "BucketName" {
  value = alicloud_oss_bucket.Bucket_001.bucket
}

output "InstanceName" {
  value = alicloud_ots_instance.Instance_001.name
}

# output "TableName" {
#   value = alicloud_ots_table.Table_001.table_name
# }
