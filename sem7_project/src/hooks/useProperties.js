import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../services/api';
import toast from 'react-hot-toast';

// Hook to fetch all properties
export const useProperties = (params) => {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => propertyService.getProperties(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch single property
export const useProperty = (id) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getPropertyById(id),
    enabled: !!id,
  });
};

// Hook to create property
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: propertyService.createProperty,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Property created successfully!');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create property');
    },
  });
};

// Hook to update property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => propertyService.updateProperty(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['properties']);
      queryClient.invalidateQueries(['property', variables.id]);
      toast.success('Property updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update property');
    },
  });
};

// Hook to delete property
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: propertyService.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Property deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    },
  });
};

// Hook to fetch available properties
export const useAvailableProperties = () => {
  return useQuery({
    queryKey: ['properties', 'available'],
    queryFn: propertyService.getAvailableProperties,
  });
};

// Hook to search properties
export const useSearchProperties = (searchCriteria, enabled = false) => {
  return useQuery({
    queryKey: ['properties', 'search', searchCriteria],
    queryFn: () => propertyService.searchProperties(searchCriteria),
    enabled: enabled && !!searchCriteria,
  });
};
