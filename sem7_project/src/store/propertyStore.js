import { create } from 'zustand';
import { propertyAPI } from '../services/api';
import toast from 'react-hot-toast';

const usePropertyStore = create((set, get) => ({
  properties: [],
  featuredProperties: [],
  currentProperty: null,
  filters: {
    type: '',
    city: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    propertyType: '',
    furnishing: '',
    sortBy: 'date',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
  },
  isLoading: false,
  error: null,

  fetchProperties: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filters, pagination } = get();
      const queryParams = {
        ...filters,
        ...params,
        page: params.page || pagination.currentPage,
        limit: pagination.itemsPerPage,
      };
      
      const response = await propertyAPI.getProperties(queryParams);
      // Backend returns: { success: true, data: { properties: [...], pagination: {...} } }
      // So we need response.data.data not response.data
      const responseData = response.data?.data || response.data || {};
      const rawProperties = responseData.properties || [];
      
      console.log('📊 Fetched properties:', {
        total: rawProperties.length,
        responseStructure: Object.keys(response.data || {}),
        dataStructure: Object.keys(responseData || {})
      });
      
      // Map backend property fields (PascalCase) to frontend fields (camelCase)
      const propertiesData = rawProperties.map(prop => {
        // Get the first image URL - Use MainImage or PropertyImage field
        const getPropertyImage = () => {
          console.log('🔍 Checking image for property:', {
            Id: prop.Id,
            MainImage: prop.MainImage,
            PropertyImage: prop.PropertyImage,
            imagesLength: prop.images?.length
          });
          
          // Priority 1: MainImage field from database
          if (prop.MainImage) {
            const img = prop.MainImage;
            // Ensure no double slashes
            const cleanPath = img.startsWith('/') ? img : `/${img}`;
            const fullUrl = img.startsWith('http') ? img : `http://localhost:5000${cleanPath}`;
            console.log('✅ Using MainImage:', fullUrl);
            return fullUrl;
          }
          
          // Priority 2: PropertyImage field from backend
          if (prop.PropertyImage) {
            const img = prop.PropertyImage;
            // Ensure no double slashes
            const cleanPath = img.startsWith('/') ? img : `/${img}`;
            const fullUrl = img.startsWith('http') ? img : `http://localhost:5000${cleanPath}`;
            console.log('✅ Using PropertyImage:', fullUrl);
            return fullUrl;
          }
          
          // Priority 3: First image from images array
          if (prop.images && prop.images.length > 0) {
            const firstImage = prop.images[0];
            const imagePath = firstImage.ImageURL || firstImage.ImagePath;
            if (imagePath) {
              // Ensure no double slashes
              const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
              const fullUrl = imagePath.startsWith('http') ? imagePath : `http://localhost:5000${cleanPath}`;
              console.log('✅ Using images[0]:', fullUrl);
              return fullUrl;
            }
          }
          
          // No image available
          console.log('❌ No image found for property:', prop.Id);
          return null;
        };

        const propertyImage = getPropertyImage();
        
        // Debug: Log EVERY property's image data
        console.log('🖼️ Property image debug:', {
          propertyId: prop.Id,
          title: prop.Title,
          hasMainImage: !!prop.MainImage,
          hasPropertyImage: !!prop.PropertyImage,
          hasImagesArray: prop.images?.length > 0,
          constructedImageUrl: propertyImage,
          imageStartsWithHttp: propertyImage?.startsWith('http')
        });

        return {
          id: prop.Id,
          title: prop.Title,
          description: prop.Description,
          address: prop.Address,
          city: prop.City,
          state: prop.State,
          price: prop.Price,
          size: prop.Size,
          bedrooms: prop.Bedrooms,
          bathrooms: prop.Bathrooms,
          propertyType: prop.PropertyType,
          listingType: prop.ListingType,
          type: prop.ListingType, // For backward compatibility
          furnishing: prop.Furnishing,
          status: prop.Status,
          propertyImage: propertyImage,
          images: prop.images || [],
          facilities: prop.facilities || [],
          ownerName: prop.OwnerName,
          agentName: prop.AgentName,
          createdAt: prop.CreatedAt,
          // Pass through all other fields
          ...prop
        };
      });
      
      set({
        properties: propertiesData,
        pagination: {
          ...pagination,
          currentPage: responseData.pagination?.currentPage || responseData.currentPage || 1,
          totalPages: responseData.pagination?.totalPages || responseData.totalPages || 1,
          totalItems: responseData.pagination?.totalItems || responseData.totalItems || rawProperties.length,
        },
        isLoading: false,
      });
      
      console.log('✅ Properties loaded:', propertiesData.length, 'properties');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch properties';
      set({ 
        error: errorMessage, 
        isLoading: false,
        properties: [],  // Ensure properties is always an array
      });
      // Only show toast if it's not a network error (backend not running)
      if (error.response?.status !== 0) {
        toast.error(errorMessage);
      }
      console.error('Error fetching properties:', error);
    }
  },

  fetchPropertyById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await propertyAPI.getPropertyById(id);
      const rawProperty = response.data?.data || response.data;
      
      // DEBUG: Log the entire response to see structure
      console.log('🔍 Full API Response:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        rawProperty: rawProperty,
        imagesField: rawProperty.images,
        ImagesField: rawProperty.Images,
        allKeys: Object.keys(rawProperty || {})
      });
      
      // Process images with full URLs - Handle MainImage + all gallery images
      const processImages = () => {
        const imagesArray = rawProperty.images || rawProperty.Images || [];
        
        console.log('🔍 Processing images for property detail:', {
          propertyId: id,
          hasMainImage: !!rawProperty.MainImage,
          imagesArrayLength: imagesArray.length,
          firstImage: imagesArray[0]
        });
        
        if (!imagesArray || imagesArray.length === 0) {
          console.log('⚠️  No images array found for property:', id);
          
          // If no images array, but MainImage exists, use it
          if (rawProperty.MainImage) {
            const mainUrl = rawProperty.MainImage.startsWith('http') 
              ? rawProperty.MainImage 
              : `http://localhost:5000${rawProperty.MainImage}`;
            console.log('✅ Using MainImage as fallback:', mainUrl);
            return [mainUrl];
          }
          
          return []; // Return empty array if no images at all
        }
        
        console.log('✅ Found images:', {
          MainImage: rawProperty.MainImage,
          galleryCount: imagesArray.length,
          imageTypes: imagesArray.map(img => img.ImageType)
        });
        
        // Convert all images to full URLs
        const allImages = imagesArray.map(img => {
          const imagePath = img.ImageURL || img.ImagePath || img.imagePath;
          if (!imagePath) {
            console.log('❌ No image path in:', img);
            return null;
          }
          
          // Clean the path
          const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          
          // If already full URL, return as is
          if (imagePath.startsWith('http')) {
            console.log('✅ Image already has full URL:', imagePath);
            return imagePath;
          }
          
          // Construct full URL
          const fullUrl = `http://localhost:5000${cleanPath}`;
          console.log('✅ Constructed full URL:', fullUrl);
          return fullUrl;
        }).filter(url => url !== null);
        
        console.log('✅ Processed images total:', allImages.length, 'URLs:', allImages);
        return allImages;
      };
      
      // Process main image from MainImage field
      const getMainImage = () => {
        if (rawProperty.MainImage) {
          const mainImg = rawProperty.MainImage;
          return mainImg.startsWith('http') ? mainImg : `http://localhost:5000${mainImg}`;
        }
        return null;
      };
      
      const processedImages = processImages();
      const mainImage = getMainImage();
      
      // Map backend fields to frontend fields
      const mappedProperty = {
        id: rawProperty.Id,
        title: rawProperty.Title,
        description: rawProperty.Description,
        address: rawProperty.Address,
        city: rawProperty.City,
        state: rawProperty.State,
        price: rawProperty.Price,
        size: rawProperty.Size,
        bedrooms: rawProperty.Bedrooms,
        bathrooms: rawProperty.Bathrooms,
        propertyType: rawProperty.PropertyType,
        listingType: rawProperty.ListingType,
        type: rawProperty.ListingType,
        furnishing: rawProperty.Furnishing,
        status: rawProperty.Status,
        agentId: rawProperty.AgentId,
        agentName: rawProperty.AgentName,
        createdAt: rawProperty.CreatedAt,
        facilities: rawProperty.facilities || [],
        // Use MainImage as the primary display image, with all gallery images
        propertyImage: processedImages, // Array of all images
        mainImage: mainImage, // Main image URL
        images: rawProperty.images || [], // Keep raw images data
        islike: rawProperty.IsLike || false,
        views: rawProperty.Views,
        ownerName: rawProperty.OwnerName,
        agent: {
          name: rawProperty.AgentName,
          email: rawProperty.AgentEmail,
          mobileno: rawProperty.AgentMobile,
          profilepic: null,
          rating: 4.5,
          totalProperties: 0,
        },
        ...rawProperty
      };
      
      console.log('✅ Property details loaded:', {
        id: mappedProperty.id,
        title: mappedProperty.title,
        imageCount: mappedProperty.propertyImage.length,
        firstImage: mappedProperty.propertyImage[0]
      });
      set({ currentProperty: mappedProperty, isLoading: false });
      return mappedProperty;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch property';
      set({ error: errorMessage, isLoading: false, currentProperty: null });
      toast.error(errorMessage);
      throw error;
    }
  },

  fetchFeaturedProperties: async () => {
    try {
      const response = await propertyAPI.getFeaturedProperties();
      const rawFeatured = Array.isArray(response.data) 
        ? response.data 
        : response.data.data || response.data.properties || [];
      
      // Map backend fields to frontend fields
      const featuredData = rawFeatured.map(prop => {
        // Process image URL - Priority: MainImage > PropertyImage > images[0]
        let imageUrl = null;
        
        // Priority 1: MainImage field
        if (prop.MainImage) {
          imageUrl = prop.MainImage.startsWith('http') 
            ? prop.MainImage 
            : `http://localhost:5000${prop.MainImage}`;
        }
        // Priority 2: PropertyImage field
        else if (prop.PropertyImage) {
          imageUrl = prop.PropertyImage.startsWith('http') 
            ? prop.PropertyImage 
            : `http://localhost:5000${prop.PropertyImage}`;
        }
        // Priority 3: First image from images array
        else if (prop.images && prop.images.length > 0) {
          const img = prop.images[0].ImageURL || prop.images[0].ImagePath;
          if (img) {
            imageUrl = img.startsWith('http') ? img : `http://localhost:5000${img}`;
          }
        }
        
        return {
          id: prop.Id,
          title: prop.Title,
          description: prop.Description,
          address: prop.Address,
          city: prop.City,
          state: prop.State,
          price: prop.Price,
          size: prop.Size,
          bedrooms: prop.Bedrooms,
          bathrooms: prop.Bathrooms,
          propertyType: prop.PropertyType,
          listingType: prop.ListingType,
          type: prop.ListingType,
          furnishing: prop.Furnishing,
          status: prop.Status,
          propertyImage: imageUrl,
          ownerName: prop.OwnerName,
          agentName: prop.AgentName,
          ...prop
        };
      });
      
      set({ featuredProperties: featuredData });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch featured properties:', error);
    }
  },

  createProperty: async (propertyData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await propertyAPI.createProperty(propertyData);
      const { properties } = get();
      set({
        properties: [response.data, ...properties],
        isLoading: false,
      });
      toast.success('Property created successfully');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create property';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  updateProperty: async (id, propertyData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await propertyAPI.updateProperty(id, propertyData);
      const { properties } = get();
      const updatedProperties = properties.map(p => 
        p.id === id ? response.data : p
      );
      set({
        properties: updatedProperties,
        currentProperty: response.data,
        isLoading: false,
      });
      toast.success('Property updated successfully');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update property';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteProperty: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await propertyAPI.deleteProperty(id);
      const { properties } = get();
      const filteredProperties = properties.filter(p => p.id !== id);
      set({
        properties: filteredProperties,
        isLoading: false,
      });
      toast.success('Property deleted successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete property';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  likeProperty: async (id) => {
    try {
      await propertyAPI.likeProperty(id);
      const { properties, currentProperty } = get();
      
      const updatedProperties = properties.map(p => 
        p.id === id ? { ...p, islike: true } : p
      );
      
      const updatedCurrentProperty = currentProperty?.id === id 
        ? { ...currentProperty, islike: true }
        : currentProperty;
      
      set({
        properties: updatedProperties,
        currentProperty: updatedCurrentProperty,
      });
      toast.success('Property saved to favorites');
    } catch (error) {
      toast.error('Failed to save property');
    }
  },

  unlikeProperty: async (id) => {
    try {
      await propertyAPI.unlikeProperty(id);
      const { properties, currentProperty } = get();
      
      const updatedProperties = properties.map(p => 
        p.id === id ? { ...p, islike: false } : p
      );
      
      const updatedCurrentProperty = currentProperty?.id === id 
        ? { ...currentProperty, islike: false }
        : currentProperty;
      
      set({
        properties: updatedProperties,
        currentProperty: updatedCurrentProperty,
      });
      toast.success('Property removed from favorites');
    } catch (error) {
      toast.error('Failed to remove property');
    }
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, currentPage: 1 },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        type: '',
        city: '',
        state: '',
        minPrice: '',
        maxPrice: '',
        minSize: '',
        maxSize: '',
        propertyType: '',
        furnishing: '',
        sortBy: 'date',
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12,
      },
    });
  },

  setCurrentPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, currentPage: page },
    }));
  },

  clearError: () => set({ error: null }),
}));

export default usePropertyStore;
